import { writable } from 'svelte/store';
import { settingsAgent } from './settings-agent';
import { taskAgent } from './task-agent';
import { playAlarmFile, startTickingSound, stopTickingSound } from '$lib/audio/sounds';

export type TimerMode = 'Pomodoro' | 'ShortBreak' | 'LongBreak';
export type TimerStatus = 'running' | 'paused' | 'stopped';

export interface TimerState {
	currentMode: TimerMode;
	timerStatus: TimerStatus;
	timeRemaining: number; // in seconds
	pomodorosCompletedInCycle: number;
}

const STORAGE_KEY = 'pomodoro-timer';

function loadTimerFromStorage(): Partial<TimerState> {
	if (typeof window === 'undefined') return {};

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Only load persistent state, not running timers
			return {
				currentMode: parsed.currentMode || 'Pomodoro',
				pomodorosCompletedInCycle: parsed.pomodorosCompletedInCycle || 0
			};
		}
	} catch (error) {
		console.warn('Failed to load timer state from localStorage:', error);
	}

	return {};
}

function saveTimerToStorage(state: TimerState): void {
	if (typeof window === 'undefined') return;

	try {
		// Only save persistent state
		const persistentState = {
			currentMode: state.currentMode,
			pomodorosCompletedInCycle: state.pomodorosCompletedInCycle
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(persistentState));
	} catch (error) {
		console.warn('Failed to save timer state to localStorage:', error);
	}
}

function createTimerAgent() {
	const storedState = loadTimerFromStorage();
	const initialState: TimerState = {
		currentMode: storedState.currentMode || 'Pomodoro',
		timerStatus: 'stopped',
		timeRemaining: getDurationForMode(storedState.currentMode || 'Pomodoro'),
		pomodorosCompletedInCycle: storedState.pomodorosCompletedInCycle || 0
	};

	const { subscribe, update, set } = writable<TimerState>(initialState);

	let intervalId: number | null = null;

	// Save to localStorage when persistent state changes
	subscribe((state) => {
		saveTimerToStorage(state);
	});

	function getDurationForMode(mode: TimerMode): number {
		const settings = settingsAgent.getSetting('timerSettings') as {
			pomodoro?: number;
			shortBreak?: number;
			longBreak?: number;
		};
		switch (mode) {
			case 'Pomodoro':
				return (settings?.pomodoro || 25) * 60;
			case 'ShortBreak':
				return (settings?.shortBreak || 5) * 60;
			case 'LongBreak':
				return (settings?.longBreak || 15) * 60;
		}
	}

	function getLongBreakInterval(): number {
		const settings = settingsAgent.getSetting('timerSettings') as { longBreakInterval?: number };
		return settings?.longBreakInterval || 4;
	}

	// Request notification permission on first use
	let notificationPermissionGranted = false;
	if (typeof window !== 'undefined' && 'Notification' in window) {
		Notification.requestPermission().then((permission) => {
			notificationPermissionGranted = permission === 'granted';
		});
	}

	function showNotification(title: string, body: string) {
		if (!notificationPermissionGranted || typeof window === 'undefined' || !('Notification' in window)) {
			return;
		}

		try {
			new Notification(title, {
				body,
				icon: '/favicon.svg',
				tag: 'pomodoro-timer' // Prevents duplicate notifications
			});
		} catch (error) {
			console.warn('Failed to show notification:', error);
		}
	}

	function startTimer() {
		update((state) => {
			if (state.timerStatus === 'running') return state;
			const newState = { ...state, timerStatus: 'running' as TimerStatus };

			// Start ticking sound if in Pomodoro mode
			if (newState.currentMode === 'Pomodoro') {
				const soundSettings = settingsAgent.getSetting('soundSettings') as {
					tickingSound?: string;
					tickingVolume?: number;
				};
				if (soundSettings?.tickingSound && soundSettings.tickingSound !== 'None') {
					startTickingSound(soundSettings.tickingSound, (soundSettings.tickingVolume || 50) / 100);
				}
			}

			return newState;
		});

		if (intervalId) clearInterval(intervalId);
		intervalId = window.setInterval(() => {
			update((state) => {
				if (state.timerStatus !== 'running') return state;

				const newTimeRemaining = state.timeRemaining - 1;

				// Show reminder notification for last minute
				if (newTimeRemaining === 60) { // 1 minute left
					const notificationSettings = settingsAgent.getSetting('notificationSettings') as {
						reminder?: boolean;
					};
					if (notificationSettings?.reminder) {
						const modeName = state.currentMode === 'Pomodoro' ? 'Pomodoro session' :
										state.currentMode === 'ShortBreak' ? 'short break' : 'long break';
						showNotification('Pomodoro Timer', `1 minute remaining in your ${modeName}`);
					}
				}

				if (newTimeRemaining <= 0) {
					// Timer completed
					clearInterval(intervalId!);
					intervalId = null;

					// Stop ticking sound
					stopTickingSound();

					// Handle end-of-session: alarm and mode transitions
					const s = settingsAgent.getSetting('soundSettings') as {
						alarmRepeat?: number;
						alarmVolume?: number;
						alarmSound?: string;
						muted?: boolean;
					};
					if (!s?.muted) {
						const sound = (s?.alarmSound || 'Bell').toLowerCase();
						const map: Record<string, string[]> = {
							bell: ['/sounds/bell.mp3'],
							kitchen: ['/sounds/kitchen.mp3'],
							bird: ['/sounds/bird.mp3'],
							digital: ['/sounds/digital.mp3'],
							wood: ['/sounds/wood.mp3']
						};
						const urls = map[sound] || map['bell'];
						playAlarmFile(urls, s?.alarmRepeat ?? 1, (s?.alarmVolume ?? 50) / 100).catch(() => {});
					}

					// Handle mode transitions
					let nextMode: TimerMode;
					let pomodorosCompleted = state.pomodorosCompletedInCycle;

					if (state.currentMode === 'Pomodoro') {
						pomodorosCompleted += 1;
						// Increment actual pomodoros for active task
						const activeTaskId = taskAgent.activeTaskId;
						if (activeTaskId) {
							taskAgent.incrementActualPomodoros(activeTaskId);
						}
						// Check if long break is needed (every 4 pomodoros)
						nextMode =
							pomodorosCompleted % getLongBreakInterval() === 0 ? 'LongBreak' : 'ShortBreak';
					} else {
						// After break, go back to Pomodoro
						nextMode = 'Pomodoro';
					}

					// Determine auto-start preference for the next session
					const t = settingsAgent.getSetting('timerSettings') as {
						autoStartBreaks?: boolean;
						autoStartPomodoros?: boolean;
					};
					const willAutoStart =
						nextMode === 'Pomodoro' ? !!t?.autoStartPomodoros : !!t?.autoStartBreaks;

					const newState: TimerState = {
						...state,
						timerStatus: (willAutoStart ? 'running' : 'stopped') as TimerStatus,
						timeRemaining: getDurationForMode(nextMode),
						currentMode: nextMode,
						pomodorosCompletedInCycle: pomodorosCompleted
					};

					// Start ticking sound for auto-started Pomodoro
					if (willAutoStart && nextMode === 'Pomodoro') {
						const soundSettings = settingsAgent.getSetting('soundSettings') as {
							tickingSound?: string;
							tickingVolume?: number;
						};
						if (soundSettings?.tickingSound && soundSettings.tickingSound !== 'None') {
							setTimeout(() => {
								startTickingSound(soundSettings.tickingSound!, (soundSettings.tickingVolume || 50) / 100);
							}, 100); // Small delay to ensure timer state is updated
						}
					}

					// If auto-start, spin up a fresh interval tick by calling startTimer-like behavior
					if (willAutoStart && !intervalId) {
						setTimeout(() => {
							startTimer();
						}, 0);
					}

					return newState;
				}

				return { ...state, timeRemaining: newTimeRemaining };
			});
		}, 1000);
	}

	function pauseTimer() {
		update((state) => {
			if (state.timerStatus !== 'running') return state;
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			// Stop ticking sound when paused
			stopTickingSound();
			return { ...state, timerStatus: 'paused' };
		});
	}

	function resetTimer() {
		update((state) => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			// Stop ticking sound when reset
			stopTickingSound();
			return {
				...state,
				timerStatus: 'stopped',
				timeRemaining: getDurationForMode(state.currentMode)
			};
		});
	}

	function switchMode(mode: TimerMode) {
		update((state) => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
			// Stop ticking sound when switching modes
			stopTickingSound();
			return {
				...state,
				currentMode: mode,
				timerStatus: 'stopped',
				timeRemaining: getDurationForMode(mode)
			};
		});
	}

	return {
		subscribe,
		startTimer,
		pauseTimer,
		resetTimer,
		switchMode
	};
}

export const timerAgent = createTimerAgent();

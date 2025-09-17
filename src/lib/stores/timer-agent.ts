import { writable } from 'svelte/store';
import { settingsAgent } from './settings-agent';
import { taskAgent } from './task-agent';
import { playAlarmFile } from '$lib/audio/sounds';

export type TimerMode = 'Pomodoro' | 'ShortBreak' | 'LongBreak';
export type TimerStatus = 'running' | 'paused' | 'stopped';

export interface TimerState {
	currentMode: TimerMode;
	timerStatus: TimerStatus;
	timeRemaining: number; // in seconds
	pomodorosCompletedInCycle: number;
}

function createTimerAgent() {
	const initialState: TimerState = {
		currentMode: 'Pomodoro',
		timerStatus: 'stopped',
		timeRemaining: getDurationForMode('Pomodoro'),
		pomodorosCompletedInCycle: 0
	};

	const { subscribe, update, set } = writable<TimerState>(initialState);

	let intervalId: number | null = null;

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

	// Keep timeRemaining in sync with settings when timer is not running
	settingsAgent.subscribe(() => {
		let snap: TimerState | undefined;
		const unsub = subscribe((s) => (snap = s));
		unsub();
		if (!snap) return;
		if (snap.timerStatus === 'running') return;
		const newDuration = getDurationForMode(snap.currentMode);
		if (snap.timeRemaining !== newDuration) {
			set({ ...snap, timeRemaining: newDuration });
		}
	});

	function startTimer() {
		update((state) => {
			if (state.timerStatus === 'running') return state;
			return { ...state, timerStatus: 'running' };
		});

		if (intervalId) clearInterval(intervalId);
		intervalId = window.setInterval(() => {
			update((state) => {
				if (state.timerStatus !== 'running') return state;

				const newTimeRemaining = state.timeRemaining - 1;
				if (newTimeRemaining <= 0) {
					// Timer completed
					clearInterval(intervalId!);
					intervalId = null;

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
			return { ...state, timerStatus: 'paused' };
		});
	}

	function resetTimer() {
		update((state) => {
			if (intervalId) {
				clearInterval(intervalId);
				intervalId = null;
			}
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

import { writable } from 'svelte/store';
import { settingsAgent } from './settings-agent';
import { taskAgent } from './task-agent';

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

	const { subscribe, update } = writable<TimerState>(initialState);

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

					return {
						...state,
						timerStatus: 'stopped',
						timeRemaining: getDurationForMode(nextMode),
						currentMode: nextMode,
						pomodorosCompletedInCycle: pomodorosCompleted
					};
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

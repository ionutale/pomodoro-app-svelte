import { writable } from 'svelte/store';
import { settingsAgent } from './settings-agent';

export interface DailyProgress {
	date: string; // YYYY-MM-DD format
	pomodorosCompleted: number;
	goal: number;
}

export interface WeeklyProgress {
	weekStart: string; // YYYY-MM-DD format (Monday)
	pomodorosCompleted: number;
	goal: number;
}

export interface GoalsState {
	dailyProgress: DailyProgress[];
	weeklyProgress: WeeklyProgress[];
	currentDay: string;
	currentWeek: string;
}

const STORAGE_KEY = 'pomodoro-goals';

function getCurrentDate(): string {
	return new Date().toISOString().split('T')[0];
}

function getCurrentWeekStart(): string {
	const now = new Date();
	const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
	const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Adjust to Monday
	const monday = new Date(now.setDate(diff));
	return monday.toISOString().split('T')[0];
}

function loadGoalsFromStorage(): GoalsState {
	if (typeof window === 'undefined') {
		const today = getCurrentDate();
		const thisWeek = getCurrentWeekStart();
		return {
			dailyProgress: [{ date: today, pomodorosCompleted: 0, goal: 8 }],
			weeklyProgress: [{ weekStart: thisWeek, pomodorosCompleted: 0, goal: 40 }],
			currentDay: today,
			currentWeek: thisWeek
		};
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return parsed;
		}
	} catch (error) {
		console.warn('Failed to load goals from localStorage:', error);
	}

	// Initialize with current date/week
	const today = getCurrentDate();
	const thisWeek = getCurrentWeekStart();
	return {
		dailyProgress: [{ date: today, pomodorosCompleted: 0, goal: 8 }],
		weeklyProgress: [{ weekStart: thisWeek, pomodorosCompleted: 0, goal: 40 }],
		currentDay: today,
		currentWeek: thisWeek
	};
}

function saveGoalsToStorage(state: GoalsState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save goals to localStorage:', error);
	}
}

function createGoalsAgent() {
	const initialState = loadGoalsFromStorage();
	const { subscribe, update } = writable<GoalsState>(initialState);

	// Save to localStorage when state changes
	subscribe((state) => {
		saveGoalsToStorage(state);
	});

	function ensureCurrentDayAndWeek(state: GoalsState): GoalsState {
		const today = getCurrentDate();
		const thisWeek = getCurrentWeekStart();

		const newState = { ...state };

		// Ensure we have today's entry
		if (!newState.dailyProgress.find(d => d.date === today)) {
			const dailyGoal = settingsAgent.getSetting('goalsSettings.dailyPomodoros') || 8;
			newState.dailyProgress.push({
				date: today,
				pomodorosCompleted: 0,
				goal: dailyGoal
			});
		}

		// Ensure we have this week's entry
		if (!newState.weeklyProgress.find(w => w.weekStart === thisWeek)) {
			const weeklyGoal = settingsAgent.getSetting('goalsSettings.weeklyPomodoros') || 40;
			newState.weeklyProgress.push({
				weekStart: thisWeek,
				pomodorosCompleted: 0,
				goal: weeklyGoal
			});
		}

		// Update current pointers
		newState.currentDay = today;
		newState.currentWeek = thisWeek;

		return newState;
	}

	function recordPomodoro(): void {
		update((state) => {
			const newState = ensureCurrentDayAndWeek(state);

			// Update today's progress
			const todayEntry = newState.dailyProgress.find(d => d.date === newState.currentDay);
			if (todayEntry) {
				todayEntry.pomodorosCompleted += 1;
			}

			// Update this week's progress
			const weekEntry = newState.weeklyProgress.find(w => w.weekStart === newState.currentWeek);
			if (weekEntry) {
				weekEntry.pomodorosCompleted += 1;
			}

			return newState;
		});
	}

	function updateGoals(): void {
		update((state) => {
			const newState = ensureCurrentDayAndWeek(state);

			// Update daily goals
			const dailyGoal = settingsAgent.getSetting('goalsSettings.dailyPomodoros') || 8;
			const todayEntry = newState.dailyProgress.find(d => d.date === newState.currentDay);
			if (todayEntry) {
				todayEntry.goal = dailyGoal;
			}

			// Update weekly goals
			const weeklyGoal = settingsAgent.getSetting('goalsSettings.weeklyPomodoros') || 40;
			const weekEntry = newState.weeklyProgress.find(w => w.weekStart === newState.currentWeek);
			if (weekEntry) {
				weekEntry.goal = weeklyGoal;
			}

			return newState;
		});
	}

	function getTodayProgress(): DailyProgress | null {
		const state = initialState;
		return state.dailyProgress.find(d => d.date === state.currentDay) || null;
	}

	function getThisWeekProgress(): WeeklyProgress | null {
		const state = initialState;
		return state.weeklyProgress.find(w => w.weekStart === state.currentWeek) || null;
	}

	function getStreak(): number {
		const state = initialState;
		let streak = 0;
		const sortedDays = state.dailyProgress
			.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

		for (const day of sortedDays) {
			if (day.pomodorosCompleted >= day.goal) {
				streak++;
			} else {
				break;
			}
		}

		return streak;
	}

	// Initialize goals when settings change
	settingsAgent.subscribe(() => {
		updateGoals();
	});

	return {
		subscribe,
		recordPomodoro,
		updateGoals,
		getTodayProgress,
		getThisWeekProgress,
		getStreak
	};
}

export const goalsAgent = createGoalsAgent();
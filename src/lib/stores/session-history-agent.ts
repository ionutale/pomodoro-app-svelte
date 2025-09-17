import { writable } from 'svelte/store';

export interface SessionRecord {
	id: string;
	mode: 'Pomodoro' | 'ShortBreak' | 'LongBreak';
	startTime: Date;
	endTime: Date;
	duration: number; // in seconds
	taskId?: string | null;
	taskName?: string | null;
}

export interface SessionHistoryState {
	sessions: SessionRecord[];
}

const STORAGE_KEY = 'pomodoro-session-history';
const MAX_SESSIONS = 1000; // Keep last 1000 sessions

function loadSessionHistoryFromStorage(): SessionHistoryState {
	if (typeof window === 'undefined') {
		return { sessions: [] };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Convert date strings back to Date objects
			const sessions = parsed.sessions?.map((session: SessionRecord & { startTime?: string; endTime?: string }) => ({
				...session,
				startTime: session.startTime ? new Date(session.startTime) : new Date(),
				endTime: session.endTime ? new Date(session.endTime) : new Date()
			})) || [];
			return { sessions };
		}
	} catch (error) {
		console.warn('Failed to load session history from localStorage:', error);
	}

	return { sessions: [] };
}

function saveSessionHistoryToStorage(state: SessionHistoryState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save session history to localStorage:', error);
	}
}

function createSessionHistoryAgent() {
	const initialState = loadSessionHistoryFromStorage();
	const { subscribe, update } = writable<SessionHistoryState>(initialState);

	// Save to localStorage when state changes
	subscribe((state) => {
		saveSessionHistoryToStorage(state);
	});

	function generateId(): string {
		return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	function recordSession(
		mode: 'Pomodoro' | 'ShortBreak' | 'LongBreak',
		startTime: Date,
		duration: number,
		taskId?: string | null,
		taskName?: string | null
	): void {
		const session: SessionRecord = {
			id: generateId(),
			mode,
			startTime,
			endTime: new Date(),
			duration,
			taskId,
			taskName
		};

		update((state) => {
			const newSessions = [session, ...state.sessions].slice(0, MAX_SESSIONS);
			return { sessions: newSessions };
		});
	}

	function clearHistory(): void {
		update(() => ({ sessions: [] }));
	}

	function getSessionsForDateRange(startDate: Date, endDate: Date): SessionRecord[] {
		return initialState.sessions.filter(session =>
			session.startTime >= startDate && session.startTime <= endDate
		);
	}

	function getTotalFocusTime(startDate?: Date, endDate?: Date): number {
		const sessions = startDate && endDate
			? getSessionsForDateRange(startDate, endDate)
			: initialState.sessions;

		return sessions
			.filter(session => session.mode === 'Pomodoro')
			.reduce((total, session) => total + session.duration, 0);
	}

	function getSessionStats(startDate?: Date, endDate?: Date) {
		const sessions = startDate && endDate
			? getSessionsForDateRange(startDate, endDate)
			: initialState.sessions;

		const pomodoroSessions = sessions.filter(s => s.mode === 'Pomodoro');
		const breakSessions = sessions.filter(s => s.mode !== 'Pomodoro');

		return {
			totalSessions: sessions.length,
			pomodoroSessions: pomodoroSessions.length,
			breakSessions: breakSessions.length,
			totalFocusTime: pomodoroSessions.reduce((total, s) => total + s.duration, 0),
			averageSessionLength: pomodoroSessions.length > 0
				? pomodoroSessions.reduce((total, s) => total + s.duration, 0) / pomodoroSessions.length
				: 0
		};
	}

	return {
		subscribe,
		recordSession,
		clearHistory,
		getSessionsForDateRange,
		getTotalFocusTime,
		getSessionStats
	};
}

export const sessionHistoryAgent = createSessionHistoryAgent();
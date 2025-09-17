import { writable } from 'svelte/store';

export type AlarmSound = 'Kitchen' | 'Bell' | 'Bird' | 'Digital' | 'Wood';
export type TickingSound = 'None' | 'Ticking Fast' | 'Ticking Slow' | 'White Noise' | 'Brown Noise';
export type HourFormat = '12h' | '24h';

export interface TimerSettings {
	pomodoro: number; // minutes
	shortBreak: number; // minutes
	longBreak: number; // minutes
	autoStartBreaks: boolean;
	autoStartPomodoros: boolean;
	longBreakInterval: number;
}

export interface SoundSettings {
	alarmSound: AlarmSound;
	alarmVolume: number; // 0-100
	alarmRepeat: number;
	tickingSound: TickingSound;
	tickingVolume: number; // 0-100
	muted?: boolean;
}

export interface ThemeSettings {
	colorTheme: string;
	hourFormat: HourFormat;
	darkModeWhenRunning: boolean;
	useGradient: boolean;
	colors: {
		pomodoro: string;
		shortBreak: string;
		longBreak: string;
	};
	customThemes: CustomTheme[];
}

export interface CustomTheme {
	id: string;
	name: string;
	colors: {
		pomodoro: string;
		shortBreak: string;
		longBreak: string;
	};
	useGradient: boolean;
}

export interface NotificationSettings {
	reminder: boolean;
	mobileAlarm: {
		enabled: boolean;
		deviceId: string | null;
		type: 'Pomodoro' | 'Breaks' | 'Both' | 'None';
	};
}

export interface IntegrationSettings {
	todoistConnected: boolean;
	webhookUrl: string | null;
	webhookEvents: ('sessionStart' | 'sessionEnd' | 'breakStart')[];
	webhookEnabled: boolean;
}

export interface GoalsSettings {
	dailyPomodoros: number;
	weeklyPomodoros: number;
	enableGoals: boolean;
}

export interface BreakActivitiesSettings {
	enabled: boolean;
	showDuration: boolean;
	categories: ('physical' | 'mental' | 'creative' | 'social' | 'relaxation')[];
}

export interface SettingsState {
	timerSettings: TimerSettings;
	soundSettings: SoundSettings;
	themeSettings: ThemeSettings;
	notificationSettings: NotificationSettings;
	integrationSettings: IntegrationSettings;
	goalsSettings: GoalsSettings;
	breakActivitiesSettings: BreakActivitiesSettings;
}

const defaultSettings: SettingsState = {
	timerSettings: {
		pomodoro: 25,
		shortBreak: 5,
		longBreak: 15,
		autoStartBreaks: false,
		autoStartPomodoros: false,
		longBreakInterval: 4
	},
	soundSettings: {
		alarmSound: 'Bell',
		alarmVolume: 50,
		alarmRepeat: 1,
		tickingSound: 'None',
		tickingVolume: 50,
		muted: false
	},
	themeSettings: {
		colorTheme: 'default',
		hourFormat: '24h',
		darkModeWhenRunning: false,
		useGradient: true,
		colors: {
			pomodoro: '#f67280',
			shortBreak: '#82ccdd',
			longBreak: '#78e08f'
		},
		customThemes: []
	},
	notificationSettings: {
		reminder: false,
		mobileAlarm: {
			enabled: false,
			deviceId: null,
			type: 'None'
		}
	},
	integrationSettings: {
		todoistConnected: false,
		webhookUrl: null,
		webhookEvents: ['sessionEnd'],
		webhookEnabled: false
	},
	goalsSettings: {
		dailyPomodoros: 8,
		weeklyPomodoros: 40,
		enableGoals: true
	},
	breakActivitiesSettings: {
		enabled: true,
		showDuration: true,
		categories: ['physical', 'mental', 'creative', 'social', 'relaxation']
	}
};

const STORAGE_KEY = 'pomodoro-settings';

function loadSettingsFromStorage(): SettingsState {
	if (typeof window === 'undefined') return defaultSettings;

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Merge with defaults to ensure new settings are included
			return { ...defaultSettings, ...parsed };
		}
	} catch (error) {
		console.warn('Failed to load settings from localStorage:', error);
	}

	return defaultSettings;
}

function saveSettingsToStorage(settings: SettingsState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
	} catch (error) {
		console.warn('Failed to save settings to localStorage:', error);
	}
}

function createSettingsAgent() {
	const initialSettings = loadSettingsFromStorage();
	const store = writable<SettingsState>(initialSettings);
	const { subscribe, update } = store;
	let currentState: SettingsState = initialSettings;

	// Save to localStorage whenever settings change
	subscribe((s) => {
		currentState = s;
		saveSettingsToStorage(s);
	});

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function updateSetting(key: string, value: any): void {
		update((state) => {
			const keys = key.split('.');
			const newState = { ...state };

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			let current: any = newState;
			for (let i = 0; i < keys.length - 1; i++) {
				if (!current[keys[i]]) current[keys[i]] = {};
				current = current[keys[i]];
			}
			current[keys[keys.length - 1]] = value;

			return newState;
		});
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	function getSetting(key: string): any {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let current: any = currentState;
		const keys = key.split('.');
		for (const k of keys) {
			current = current[k];
			if (current === undefined) return undefined;
		}
		return current;
	}

	return {
		subscribe,
		updateSetting,
		getSetting
	};
}

export const settingsAgent = createSettingsAgent();

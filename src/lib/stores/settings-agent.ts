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
}

export interface SettingsState {
	timerSettings: TimerSettings;
	soundSettings: SoundSettings;
	themeSettings: ThemeSettings;
	notificationSettings: NotificationSettings;
	integrationSettings: IntegrationSettings;
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
		}
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
		webhookUrl: null
	}
};

function createSettingsAgent() {
	const store = writable<SettingsState>(defaultSettings);
	const { subscribe, update } = store;
	let currentState: SettingsState = defaultSettings;
	subscribe((s) => {
		currentState = s;
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

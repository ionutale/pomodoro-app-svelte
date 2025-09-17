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
}

export interface ThemeSettings {
	colorTheme: string;
	hourFormat: HourFormat;
	darkModeWhenRunning: boolean;
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
		tickingVolume: 50
	},
	themeSettings: {
		colorTheme: 'default',
		hourFormat: '24h',
		darkModeWhenRunning: false
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
	const { subscribe, update } = writable<SettingsState>(defaultSettings);

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
		let current: any = defaultSettings;
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

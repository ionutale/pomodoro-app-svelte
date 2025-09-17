import { settingsAgent } from '../stores/settings-agent';
import type { ThemeSettings } from '../stores/settings-agent';

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

export class ThemeService {
	private static instance: ThemeService;

	public static getInstance(): ThemeService {
		if (!ThemeService.instance) {
			ThemeService.instance = new ThemeService();
		}
		return ThemeService.instance;
	}

	getCurrentTheme(): {
		colors: { pomodoro: string; shortBreak: string; longBreak: string };
		useGradient: boolean;
	} {
		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const colorTheme = themeSettings?.colorTheme || 'default';

		if (colorTheme === 'default') {
			return {
				colors: themeSettings?.colors || {
					pomodoro: '#f67280',
					shortBreak: '#82ccdd',
					longBreak: '#78e08f'
				},
				useGradient: themeSettings?.useGradient ?? true
			};
		}

		// Find custom theme
		const customThemes = themeSettings?.customThemes || [];
		const customTheme = customThemes.find((t: CustomTheme) => t.id === colorTheme);

		if (customTheme) {
			return {
				colors: customTheme.colors,
				useGradient: customTheme.useGradient
			};
		}

		// Fallback to default
		return {
			colors: themeSettings?.colors || {
				pomodoro: '#f67280',
				shortBreak: '#82ccdd',
				longBreak: '#78e08f'
			},
			useGradient: themeSettings?.useGradient ?? true
		};
	}

	getAllThemes(): {
		id: string;
		name: string;
		colors: { pomodoro: string; shortBreak: string; longBreak: string };
		useGradient: boolean;
	}[] {
		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const customThemes = themeSettings?.customThemes || [];

		const themes = [
			{
				id: 'default',
				name: 'Default',
				colors: {
					pomodoro: '#f67280',
					shortBreak: '#82ccdd',
					longBreak: '#78e08f'
				},
				useGradient: true
			},
			...customThemes
		];

		return themes;
	}

	saveCustomTheme(
		name: string,
		colors: { pomodoro: string; shortBreak: string; longBreak: string },
		useGradient: boolean
	): string {
		const themeId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const newTheme: CustomTheme = {
			id: themeId,
			name,
			colors,
			useGradient
		};

		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const customThemes = [...(themeSettings?.customThemes || []), newTheme];

		settingsAgent.updateSetting('themeSettings.customThemes', customThemes);

		return themeId;
	}

	updateCustomTheme(
		themeId: string,
		name: string,
		colors: { pomodoro: string; shortBreak: string; longBreak: string },
		useGradient: boolean
	): void {
		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const customThemes = themeSettings?.customThemes || [];
		const themeIndex = customThemes.findIndex((t: CustomTheme) => t.id === themeId);

		if (themeIndex >= 0) {
			customThemes[themeIndex] = {
				...customThemes[themeIndex],
				name,
				colors,
				useGradient
			};
			settingsAgent.updateSetting('themeSettings.customThemes', customThemes);
		}
	}

	deleteCustomTheme(themeId: string): void {
		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const customThemes = themeSettings?.customThemes || [];
		const filteredThemes = customThemes.filter((t: CustomTheme) => t.id !== themeId);

		settingsAgent.updateSetting('themeSettings.customThemes', filteredThemes);

		// If the deleted theme was active, switch to default
		const currentTheme = themeSettings?.colorTheme;
		if (currentTheme === themeId) {
			settingsAgent.updateSetting('themeSettings.colorTheme', 'default');
		}
	}

	validateThemeName(name: string): { valid: boolean; error?: string } {
		if (!name.trim()) {
			return { valid: false, error: 'Theme name cannot be empty' };
		}

		if (name.length > 50) {
			return { valid: false, error: 'Theme name must be less than 50 characters' };
		}

		const themeSettings = settingsAgent.getSetting('themeSettings') as ThemeSettings;
		const customThemes = themeSettings?.customThemes || [];
		const exists = customThemes.some(
			(t: CustomTheme) => t.name.toLowerCase() === name.toLowerCase().trim()
		);

		if (exists) {
			return { valid: false, error: 'A theme with this name already exists' };
		}

		return { valid: true };
	}

	applyTheme(themeId: string): void {
		settingsAgent.updateSetting('themeSettings.colorTheme', themeId);
	}
}

export const themeService = ThemeService.getInstance();

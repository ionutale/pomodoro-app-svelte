<script lang="ts">
	import { onDestroy } from 'svelte';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import ThemeEditor from './ThemeEditor.svelte';

	type TimerSettings = {
		pomodoro: number;
		shortBreak: number;
		longBreak: number;
		autoStartBreaks: boolean;
		autoStartPomodoros: boolean;
		longBreakInterval: number;
	};

	type SoundSettings = {
		alarmVolume: number;
		alarmRepeat: number;
		muted?: boolean;
	};

	type GoalsSettings = {
		enableGoals: boolean;
		dailyPomodoros: number;
		weeklyPomodoros: number;
	};

	type BreakActivitiesSettings = {
		enabled: boolean;
		showDuration: boolean;
		categories: string[];
	};

	type IntegrationSettings = {
		todoistConnected: boolean;
		webhookUrl: string | null;
		webhookEvents: string[];
		webhookEnabled: boolean;
	};

	let settings = {
		timerSettings: settingsAgent.getSetting('timerSettings') as TimerSettings,
		soundSettings: settingsAgent.getSetting('soundSettings') as SoundSettings,
		themeSettings: settingsAgent.getSetting('themeSettings') as any,
		goalsSettings: settingsAgent.getSetting('goalsSettings') as GoalsSettings,
		breakActivitiesSettings: settingsAgent.getSetting(
			'breakActivitiesSettings'
		) as BreakActivitiesSettings,
		integrationSettings: settingsAgent.getSetting('integrationSettings') as IntegrationSettings
	};
	const unsub = settingsAgent.subscribe((s) => (settings = s as typeof settings));
	onDestroy(() => unsub());

	function update(key: string, value: unknown) {
		settingsAgent.updateSetting(key, value);
	}
</script>

<section class="settings">
	<h2>Settings</h2>
	<div class="grid">
		<label>
			<span>Pomodoro (min)</span>
			<input
				type="number"
				min="1"
				max="120"
				bind:value={settings.timerSettings.pomodoro}
				on:change={(e) => update('timerSettings.pomodoro', Number(e.currentTarget.value))}
			/>
		</label>
		<label>
			<span>Short Break (min)</span>
			<input
				type="number"
				min="1"
				max="60"
				bind:value={settings.timerSettings.shortBreak}
				on:change={(e) => update('timerSettings.shortBreak', Number(e.currentTarget.value))}
			/>
		</label>
		<label>
			<span>Long Break (min)</span>
			<input
				type="number"
				min="1"
				max="60"
				bind:value={settings.timerSettings.longBreak}
				on:change={(e) => update('timerSettings.longBreak', Number(e.currentTarget.value))}
			/>
		</label>
		<label>
			<span>Long Break Interval</span>
			<input
				type="number"
				min="2"
				max="12"
				bind:value={settings.timerSettings.longBreakInterval}
				on:change={(e) => update('timerSettings.longBreakInterval', Number(e.currentTarget.value))}
			/>
		</label>
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.timerSettings.autoStartPomodoros}
				on:change={(e) => update('timerSettings.autoStartPomodoros', e.currentTarget.checked)}
			/>
			<span>Auto-start Pomodoros</span>
		</label>
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.timerSettings.autoStartBreaks}
				on:change={(e) => update('timerSettings.autoStartBreaks', e.currentTarget.checked)}
			/>
			<span>Auto-start Breaks</span>
		</label>
		<label>
			<span>Alarm Volume</span>
			<input
				type="range"
				min="0"
				max="100"
				step="1"
				bind:value={settings.soundSettings.alarmVolume}
				on:input={(e) => update('soundSettings.alarmVolume', Number(e.currentTarget.value))}
			/>
		</label>
		<label>
			<span>Alarm Repeat</span>
			<input
				type="number"
				min="1"
				max="5"
				bind:value={settings.soundSettings.alarmRepeat}
				on:change={(e) => update('soundSettings.alarmRepeat', Number(e.currentTarget.value))}
			/>
		</label>
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.soundSettings.muted}
				on:change={(e) => update('soundSettings.muted', e.currentTarget.checked)}
			/>
			<span>Mute Alarm</span>
		</label>

		<hr style="grid-column: 1 / -1; opacity:.3;" />
		<div style="grid-column: 1 / -1;">
			<ThemeEditor />
		</div>

		<hr style="grid-column: 1 / -1; opacity:.3;" />
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.goalsSettings.enableGoals}
				on:change={(e) => update('goalsSettings.enableGoals', e.currentTarget.checked)}
			/>
			<span>Enable Goals</span>
		</label>
		<label>
			<span>Daily Goal (Pomodoros)</span>
			<input
				type="number"
				min="1"
				max="50"
				bind:value={settings.goalsSettings.dailyPomodoros}
				on:change={(e) => update('goalsSettings.dailyPomodoros', Number(e.currentTarget.value))}
			/>
		</label>
		<label>
			<span>Weekly Goal (Pomodoros)</span>
			<input
				type="number"
				min="1"
				max="100"
				bind:value={settings.goalsSettings.weeklyPomodoros}
				on:change={(e) => update('goalsSettings.weeklyPomodoros', Number(e.currentTarget.value))}
			/>
		</label>

		<hr style="grid-column: 1 / -1; opacity:.3;" />
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.breakActivitiesSettings.enabled}
				on:change={(e) => update('breakActivitiesSettings.enabled', e.currentTarget.checked)}
			/>
			<span>Enable Break Activities</span>
		</label>
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.breakActivitiesSettings.showDuration}
				on:change={(e) => update('breakActivitiesSettings.showDuration', e.currentTarget.checked)}
			/>
			<span>Show Activity Duration</span>
		</label>

		<hr style="grid-column: 1 / -1; opacity:.3;" />
		<label class="toggle">
			<input
				type="checkbox"
				bind:checked={settings.integrationSettings.webhookEnabled}
				on:change={(e) => update('integrationSettings.webhookEnabled', e.currentTarget.checked)}
			/>
			<span>Enable Webhooks</span>
		</label>
		<label>
			<span>Webhook URL</span>
			<input
				type="url"
				placeholder="https://example.com/webhook"
				bind:value={settings.integrationSettings.webhookUrl}
				on:change={(e) => update('integrationSettings.webhookUrl', e.currentTarget.value)}
			/>
		</label>
		<div class="webhook-events" style="grid-column: 1 / -1;">
			<span style="font-size: 0.9rem; color: #666; margin-bottom: 0.5rem; display: block;"
				>Webhook Events:</span
			>
			<label class="toggle">
				<input
					type="checkbox"
					checked={settings.integrationSettings.webhookEvents?.includes('sessionStart')}
					on:change={(e) => {
						const events = [...(settings.integrationSettings.webhookEvents || [])];
						if (e.currentTarget.checked) {
							if (!events.includes('sessionStart')) events.push('sessionStart');
						} else {
							const index = events.indexOf('sessionStart');
							if (index > -1) events.splice(index, 1);
						}
						update('integrationSettings.webhookEvents', events);
					}}
				/>
				<span>Session Start</span>
			</label>
			<label class="toggle">
				<input
					type="checkbox"
					checked={settings.integrationSettings.webhookEvents?.includes('sessionEnd')}
					on:change={(e) => {
						const events = [...(settings.integrationSettings.webhookEvents || [])];
						if (e.currentTarget.checked) {
							if (!events.includes('sessionEnd')) events.push('sessionEnd');
						} else {
							const index = events.indexOf('sessionEnd');
							if (index > -1) events.splice(index, 1);
						}
						update('integrationSettings.webhookEvents', events);
					}}
				/>
				<span>Session End</span>
			</label>
			<label class="toggle">
				<input
					type="checkbox"
					checked={settings.integrationSettings.webhookEvents?.includes('breakStart')}
					on:change={(e) => {
						const events = [...(settings.integrationSettings.webhookEvents || [])];
						if (e.currentTarget.checked) {
							if (!events.includes('breakStart')) events.push('breakStart');
						} else {
							const index = events.indexOf('breakStart');
							if (index > -1) events.splice(index, 1);
						}
						update('integrationSettings.webhookEvents', events);
					}}
				/>
				<span>Break Start</span>
			</label>
		</div>
	</div>
</section>

<style>
	.settings {
		max-width: 800px;
		margin: 2rem auto;
		background: rgba(255, 255, 255, 0.7);
		backdrop-filter: blur(2px);
		border-radius: 12px;
		padding: 1rem 1.25rem;
	}
	.settings h2 {
		margin: 0 0 1rem 0;
	}
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem 1rem;
	}
	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
	}
	input[type='number'],
	input[type='range'] {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	.toggle {
		align-items: center;
		flex-direction: row;
		gap: 0.5rem;
	}
</style>

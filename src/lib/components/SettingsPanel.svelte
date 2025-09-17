<script lang="ts">
	import { onDestroy } from 'svelte';
	import { settingsAgent } from '$lib/stores/settings-agent';

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
	};

	let settings = {
		timerSettings: settingsAgent.getSetting('timerSettings') as TimerSettings,
		soundSettings: settingsAgent.getSetting('soundSettings') as SoundSettings
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
			<input type="number" min="1" max="120" bind:value={settings.timerSettings.pomodoro} on:change={(e)=>update('timerSettings.pomodoro', Number(e.currentTarget.value))} />
		</label>
		<label>
			<span>Short Break (min)</span>
			<input type="number" min="1" max="60" bind:value={settings.timerSettings.shortBreak} on:change={(e)=>update('timerSettings.shortBreak', Number(e.currentTarget.value))} />
		</label>
		<label>
			<span>Long Break (min)</span>
			<input type="number" min="1" max="60" bind:value={settings.timerSettings.longBreak} on:change={(e)=>update('timerSettings.longBreak', Number(e.currentTarget.value))} />
		</label>
		<label>
			<span>Long Break Interval</span>
			<input type="number" min="2" max="12" bind:value={settings.timerSettings.longBreakInterval} on:change={(e)=>update('timerSettings.longBreakInterval', Number(e.currentTarget.value))} />
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={settings.timerSettings.autoStartPomodoros} on:change={(e)=>update('timerSettings.autoStartPomodoros', e.currentTarget.checked)} />
			<span>Auto-start Pomodoros</span>
		</label>
		<label class="toggle">
			<input type="checkbox" bind:checked={settings.timerSettings.autoStartBreaks} on:change={(e)=>update('timerSettings.autoStartBreaks', e.currentTarget.checked)} />
			<span>Auto-start Breaks</span>
		</label>
		<label>
			<span>Alarm Volume</span>
			<input type="range" min="0" max="100" step="1" bind:value={settings.soundSettings.alarmVolume} on:input={(e)=>update('soundSettings.alarmVolume', Number(e.currentTarget.value))} />
		</label>
		<label>
			<span>Alarm Repeat</span>
			<input type="number" min="1" max="5" bind:value={settings.soundSettings.alarmRepeat} on:change={(e)=>update('soundSettings.alarmRepeat', Number(e.currentTarget.value))} />
		</label>
	</div>
</section>

<style>
	.settings {
		max-width: 800px;
		margin: 2rem auto;
		background: rgba(255,255,255,0.7);
		backdrop-filter: blur(2px);
		border-radius: 12px;
		padding: 1rem 1.25rem;
	}
	.settings h2 { margin: 0 0 1rem 0; }
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
	input[type='number'], input[type='range'] {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	.toggle { align-items: center; flex-direction: row; gap: 0.5rem; }
</style>

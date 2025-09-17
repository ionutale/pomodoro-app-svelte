<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import SessionHistory from '$lib/components/SessionHistory.svelte';

	let mode: TimerMode = 'Pomodoro';
	const unsub = timerAgent.subscribe((s: { currentMode: TimerMode }) => (mode = s.currentMode));
	onDestroy(() => unsub());

	let theme = settingsAgent.getSetting('themeSettings') as any;
	const unsubTheme = settingsAgent.subscribe((s) => (theme = (s as any).themeSettings));
	onDestroy(() => unsubTheme());

	$: bgClass =
		mode === 'Pomodoro' ? 'bg-pomodoro' : mode === 'ShortBreak' ? 'bg-shortbreak' : 'bg-longbreak';
	const unsubRun = timerAgent.subscribe((s: { timerStatus: 'running' | 'paused' | 'stopped' }) => {
		// No-op now, kept for future header/UI tweaks based on running state
		return s;
	});
	onDestroy(() => unsubRun());

	// Keyboard shortcuts
	function handleKeydown(event: KeyboardEvent) {
		// Don't trigger shortcuts when typing in input fields
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.code) {
			case 'Space':
				event.preventDefault();
				timerAgent.startTimer();
				break;
			case 'KeyR':
				event.preventDefault();
				timerAgent.resetTimer();
				break;
			case 'KeyT':
				event.preventDefault();
				// Cycle through modes: Pomodoro -> ShortBreak -> LongBreak -> Pomodoro
				const nextMode = mode === 'Pomodoro' ? 'ShortBreak' : mode === 'ShortBreak' ? 'LongBreak' : 'Pomodoro';
				timerAgent.switchMode(nextMode);
				break;
		}
	}

	// Add keyboard event listener
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});
</script>

<main
	class={`app-container ${bgClass}`}
	style={`--color-pomodoro:${theme?.colors?.pomodoro ?? '#f67280'}; --color-shortbreak:$
{theme?.colors?.shortBreak ?? '#82ccdd'}; --color-longbreak:${theme?.colors?.longBreak ?? '#78e08f'}; --use-gradient:${theme?.useGradient ? '1' : '0'}`}
>
	<header class="app-header">
		<h1>Pomodoro Timer</h1>
	</header>

	<div class="app-content">
		<Timer />
		<TaskList />
		<SettingsPanel />
		<SessionHistory />
	</div>
</main>

<style>
	.app-container {
		min-height: 100vh;
		padding: 2rem;
		transition: background 200ms ease;
	}

	/* Backgrounds per mode */
	.bg-pomodoro { --bg1: var(--color-pomodoro); --bg2: color-mix(in srgb, var(--color-pomodoro) 80%, white); }
	.bg-shortbreak { --bg1: var(--color-shortbreak); --bg2: color-mix(in srgb, var(--color-shortbreak) 80%, white); }
	.bg-longbreak { --bg1: var(--color-longbreak); --bg2: color-mix(in srgb, var(--color-longbreak) 80%, white); }
	.app-container { background: var(--bg1); }
	.app-container[style*='--use-gradient:1'] { background: linear-gradient(180deg, var(--bg1), var(--bg2)); }

	/* Slightly darker while running */
	.app-container.bg-pomodoro:has(.time-display.running) {
		--bg1: #ee5f70;
		--bg2: #f17888;
	}
	.app-container.bg-shortbreak:has(.time-display.running) {
		--bg1: #65bfd6;
		--bg2: #8dd0e3;
	}
	.app-container.bg-longbreak:has(.time-display.running) {
		--bg1: #61d57c;
		--bg2: #83dea1;
	}

	.app-header {
		text-align: center;
		margin-bottom: 2rem;
	}

	.app-header h1 {
		color: #333;
		font-size: 2.5rem;
		font-weight: 700;
		margin: 0;
	}

	.app-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		max-width: 800px;
		margin: 0 auto;
	}
</style>

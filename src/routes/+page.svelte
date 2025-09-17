<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
	import SessionHistory from '$lib/components/SessionHistory.svelte';
	import Goals from '$lib/components/Goals.svelte';
	import Statistics from '$lib/components/Statistics.svelte';
	import { themeService } from '$lib/services/theme-service';

	let mode: TimerMode = 'Pomodoro';
	const unsub = timerAgent.subscribe((s: { currentMode: TimerMode }) => (mode = s.currentMode));
	onDestroy(() => unsub());

	let theme = themeService.getCurrentTheme();
	const unsubTheme = settingsAgent.subscribe(() => {
		theme = themeService.getCurrentTheme();
	});
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
				{
					const nextMode: TimerMode =
						mode === 'Pomodoro' ? 'ShortBreak' : mode === 'ShortBreak' ? 'LongBreak' : 'Pomodoro';
					timerAgent.switchMode(nextMode);
				}
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
	style={`--color-pomodoro:${theme?.colors?.pomodoro ?? '#f67280'}; --color-shortbreak:${theme?.colors?.shortBreak ?? '#82ccdd'}; --color-longbreak:${theme?.colors?.longBreak ?? '#78e08f'}; --use-gradient:${theme?.useGradient ? '1' : '0'}`}
>
	<section id="timer" class="section-card">
		<header class="section-header">
			<h1>Pomodoro Timer</h1>
			<p class="subtitle">Stay focused with beautiful, calm visuals</p>
		</header>
		<Timer />
	</section>

	<section id="goals" class="section-card">
		<Goals />
	</section>

	<section id="tasks" class="section-card">
		<TaskList />
	</section>

	<section id="settings" class="section-card">
		<SettingsPanel />
	</section>

	<section id="history" class="section-card">
		<SessionHistory />
	</section>

	<section id="stats" class="section-card">
		<Statistics />
	</section>
</main>

<style>
	.app-container {
		min-height: 100vh;
		padding: 1.5rem clamp(1rem, 4vw, 2rem) 3rem;
		transition: background 200ms ease;
		display: grid;
		gap: 1.5rem;
		max-width: 1000px;
		margin: 0 auto;
	}

	/* Backgrounds per mode */
	.bg-pomodoro {
		--bg1: var(--color-pomodoro);
		--bg2: color-mix(in srgb, var(--color-pomodoro) 80%, white);
	}
	.bg-shortbreak {
		--bg1: var(--color-shortbreak);
		--bg2: color-mix(in srgb, var(--color-shortbreak) 80%, white);
	}
	.bg-longbreak {
		--bg1: var(--color-longbreak);
		--bg2: color-mix(in srgb, var(--color-longbreak) 80%, white);
	}
	.app-container {
		background: var(--bg1);
	}
	.app-container[style*='--use-gradient:1'] {
		background: linear-gradient(180deg, var(--bg1), var(--bg2));
	}

	/* Note: darker-while-running styles removed due to scoped CSS */

	.section-card {
		background: color-mix(in srgb, white 85%, transparent);
		border: 1px solid color-mix(in srgb, black 10%, transparent);
		border-radius: 16px;
		padding: 1.25rem;
		box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
		backdrop-filter: blur(8px) saturate(160%);
	}
	.section-header {
		text-align: center;
		margin-bottom: 0.5rem;
	}
	.section-header h1 {
		color: #102a43;
		font-size: clamp(1.8rem, 3.5vw, 2.4rem);
		margin: 0;
	}
	.subtitle {
		color: #2f4858;
		opacity: 0.85;
		margin: 0.25rem 0 0;
	}
</style>

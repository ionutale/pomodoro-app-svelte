<script lang="ts">
	import { onDestroy } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
		import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
		import SettingsPanel from '$lib/components/SettingsPanel.svelte';

	let mode: TimerMode = 'Pomodoro';
	const unsub = timerAgent.subscribe((s: { currentMode: TimerMode }) => (mode = s.currentMode));
	onDestroy(() => unsub());

		$: bgClass =
		mode === 'Pomodoro'
			? 'bg-pomodoro'
			: mode === 'ShortBreak'
			? 'bg-shortbreak'
			: 'bg-longbreak';
		let isRunning = false;
		const unsubRun = timerAgent.subscribe((s: any) => (isRunning = s.timerStatus === 'running'));
		onDestroy(() => unsubRun());
</script>

<main class={`app-container ${bgClass}`}>
	<header class="app-header">
		<h1>Pomodoro Timer</h1>
	</header>

	<div class="app-content">
		<Timer />
		<TaskList />
			<SettingsPanel />
	</div>
</main>

<style>
	.app-container {
		min-height: 100vh;
		padding: 2rem;
		transition: background 200ms ease;
	}

	/* Backgrounds per mode */
	.bg-pomodoro { --bg1:#f67280; --bg2:#f78c95; background: linear-gradient(180deg, var(--bg1), var(--bg2)); }
	.bg-shortbreak { --bg1:#82ccdd; --bg2:#a6dceb; background: linear-gradient(180deg, var(--bg1), var(--bg2)); }
	.bg-longbreak { --bg1:#78e08f; --bg2:#9bebaa; background: linear-gradient(180deg, var(--bg1), var(--bg2)); }

	/* Slightly darker while running */
	.app-container.bg-pomodoro:has(.time-display.running) { --bg1:#ee5f70; --bg2:#f17888; }
	.app-container.bg-shortbreak:has(.time-display.running) { --bg1:#65bfd6; --bg2:#8dd0e3; }
	.app-container.bg-longbreak:has(.time-display.running) { --bg1:#61d57c; --bg2:#83dea1; }

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

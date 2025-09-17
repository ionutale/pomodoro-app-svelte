<script lang="ts">
	import { onDestroy } from 'svelte';
	import Timer from '$lib/components/Timer.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';

	let mode: TimerMode = 'Pomodoro';
	const unsub = timerAgent.subscribe((s: { currentMode: TimerMode }) => (mode = s.currentMode));
	onDestroy(() => unsub());

	$: bgClass =
		mode === 'Pomodoro'
			? 'bg-pomodoro'
			: mode === 'ShortBreak'
			? 'bg-shortbreak'
			: 'bg-longbreak';
</script>

<main class={`app-container ${bgClass}`}>
	<header class="app-header">
		<h1>Pomodoro Timer</h1>
	</header>

	<div class="app-content">
		<Timer />
		<TaskList />
	</div>
</main>

<style>
	.app-container {
		min-height: 100vh;
		padding: 2rem;
		transition: background-color 200ms ease;
	}

	/* Backgrounds per mode */
	.bg-pomodoro {
		background-color: #f67280; /* warm red/pink */
	}
	.bg-shortbreak {
		background-color: #82ccdd; /* calm blue */
	}
	.bg-longbreak {
		background-color: #78e08f; /* fresh green */
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

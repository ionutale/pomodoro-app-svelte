<script>
	import Timer from '$lib/components/Timer.svelte';
	import TaskList from '$lib/components/TaskList.svelte';
</script>

<main class="app-container">
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
		background-color: #f8f9fa;
		padding: 2rem;
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

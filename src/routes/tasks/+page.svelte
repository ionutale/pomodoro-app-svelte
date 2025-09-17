<script lang="ts">
	import TaskList from '$lib/components/TaskList.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>Tasks</h1>
			<p class="subtitle">Organize your work into focused sessions</p>
		</header>
		<TaskList />
	</section>
</main>

<style>
	.page-wrap {
		min-height: 100vh;
		display: grid;
		place-items: start center;
		padding: 6rem 1rem 2rem;
		gap: 1rem;
	}
</style>

<script lang="ts">
	import Timer from '$lib/components/Timer.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>Pomodoro Timer</h1>
			<p class="subtitle">Stay focused with beautiful, calm visuals</p>
		</header>
		<Timer />
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

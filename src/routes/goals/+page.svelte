<script lang="ts">
	import Goals from '$lib/components/Goals.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>Goals</h1>
			<p class="subtitle">Daily and weekly targets that motivate you</p>
		</header>
		<Goals />
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

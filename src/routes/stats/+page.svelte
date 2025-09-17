<script lang="ts">
	import Statistics from '$lib/components/Statistics.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>Reports</h1>
			<p class="subtitle">Insights across days, weeks, and months</p>
		</header>
		<Statistics />
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

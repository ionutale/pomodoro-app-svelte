<script lang="ts">
	import SessionHistory from '$lib/components/SessionHistory.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>History</h1>
			<p class="subtitle">Your completed sessions and progress timeline</p>
		</header>
		<SessionHistory />
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

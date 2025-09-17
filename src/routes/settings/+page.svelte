<script lang="ts">
	import SettingsPanel from '$lib/components/SettingsPanel.svelte';
</script>

<main class="page-wrap">
	<section class="section-card">
		<header class="section-header">
			<h1>Settings</h1>
			<p class="subtitle">Tune sessions, sounds, themes, and integrations</p>
		</header>
		<SettingsPanel />
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

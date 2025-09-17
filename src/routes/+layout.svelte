<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	import NavBar from '$lib/components/NavBar.svelte';
	import { onDestroy } from 'svelte';
	import { timerAgent, type TimerMode, type TimerState } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import { themeService } from '$lib/services/theme-service';

	let { children } = $props();

	let mode: TimerMode = 'Pomodoro';
	const unsubTimer = timerAgent.subscribe((s: TimerState) => (mode = s.currentMode));

	let theme = themeService.getCurrentTheme();
	const unsubSettings = settingsAgent.subscribe(() => {
		theme = themeService.getCurrentTheme();
	});

	onDestroy(() => {
		unsubTimer?.();
		unsubSettings?.();
	});

	let brandColor = $derived(
		mode === 'Pomodoro'
			? theme.colors.pomodoro
			: mode === 'ShortBreak'
				? theme.colors.shortBreak
				: theme.colors.longBreak
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content={brandColor} />
</svelte:head>

<NavBar />
<div style="padding-top: 4rem;">{@render children?.()}</div>

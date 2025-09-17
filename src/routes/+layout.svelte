<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	import NavBar from '$lib/components/NavBar.svelte';
	import { onDestroy } from 'svelte';
	import {
		timerAgent,
		type TimerMode,
		type TimerState,
		type TimerStatus
	} from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import { themeService } from '$lib/services/theme-service';

	let { children } = $props();

	let mode: TimerMode = 'Pomodoro';
	let status: TimerStatus | undefined = undefined;
	const unsubTimer = timerAgent.subscribe((s: TimerState) => {
		mode = s.currentMode;
		status = s.timerStatus;
	});

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

	function darkenHex(hex: string, amount = 0.25): string {
		const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		if (!m) return hex;
		const to = (v: string) => Math.max(0, Math.min(255, Math.round(parseInt(v, 16) * (1 - amount))));
		const r = to(m[1]).toString(16).padStart(2, '0');
		const g = to(m[2]).toString(16).padStart(2, '0');
		const b = to(m[3]).toString(16).padStart(2, '0');
		return `#${r}${g}${b}`;
	}

	let brandColorDark = $derived(darkenHex(brandColor, 0.3));

	let darkRun = $derived(
		(settingsAgent.getSetting('themeSettings.darkModeWhenRunning') as boolean) &&
			status === 'running'
	);

	let animateGrad = $derived(!!theme.useGradient && status === 'running');

	let backgroundStyle = $derived(
		animateGrad
			? `linear-gradient(180deg, ${brandColor}, color-mix(in srgb, ${brandColor} 80%, white))`
			: brandColor
	);
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content={brandColor} />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content={brandColor} />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content={brandColorDark} />
</svelte:head>

<NavBar />
<div
	class={`app-shell ${darkRun ? 'dark-run' : ''} ${animateGrad ? 'animate-gradient' : ''}`}
	style={`padding-top:4rem; background:${backgroundStyle}; --ring-color:${brandColor}`}
>
	{@render children?.()}
</div>

<style>
	.app-shell {
		min-height: 100vh;
		transition: background 200ms ease;
	}
	:global(.dark-run) {
		color-scheme: dark;
	}
</style>

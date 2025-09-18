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
		const to = (v: string) =>
			Math.max(0, Math.min(255, Math.round(parseInt(v, 16) * (1 - amount))));
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

	$effect(() => {
		// Update meta theme-color tags dynamically on mode/theme changes
		if (typeof document !== 'undefined') {
			const light = document.querySelector('meta[name="theme-color"][media*="light"]') as HTMLMetaElement | null;
			const dark = document.querySelector('meta[name="theme-color"][media*="dark"]') as HTMLMetaElement | null;
			const base = document.querySelector('meta[name="theme-color"]:not([media])') as HTMLMetaElement | null;
			if (light) light.content = brandColor;
			if (dark) dark.content = brandColorDark;
			if (base) base.content = brandColor;
		}
	});

	// Crossfade background layers when backgroundStyle changes
	let bgLayers: { id: number; style: string }[] = [{ id: 0, style: backgroundStyle }];
	let _layerId = 1;
	let _lastBg = backgroundStyle;
	$effect(() => {
		if (backgroundStyle !== _lastBg) {
			const id = _layerId++;
			bgLayers = [...bgLayers, { id, style: backgroundStyle }];
			_lastBg = backgroundStyle;
			// After fade-in completes, keep only the newest layer
			setTimeout(() => {
				bgLayers = [{ id, style: backgroundStyle }];
			}, 260);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<meta name="theme-color" content={brandColor} />
	<meta name="theme-color" media="(prefers-color-scheme: light)" content={brandColor} />
	<meta name="theme-color" media="(prefers-color-scheme: dark)" content={brandColorDark} />
</svelte:head>

<NavBar />
<div
	class={`app-shell ${darkRun ? 'dark-run' : ''}`}
	style={`padding-top:4rem; --ring-color:${brandColor}`}
>
	<div class="bg-stack">
		{#each bgLayers as layer (layer.id)}
			<div class="bg-layer" style={`background:${layer.style}`}></div>
		{/each}
	</div>
	<div class="content-wrap">
		{@render children?.()}
	</div>
</div>

<style>
	.app-shell {
		min-height: 100vh;
		position: relative;
		overflow: hidden;
	}

	.bg-stack {
		position: absolute;
		inset: 0;
		z-index: 0;
	}

	.bg-layer {
		position: absolute;
		inset: 0;
		opacity: 0;
		animation: fade-in-bg 240ms ease forwards;
	}

	@keyframes fade-in-bg {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.content-wrap {
		position: relative;
		z-index: 1;
	}
	:global(.dark-run) {
		color-scheme: dark;
	}
</style>

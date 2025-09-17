<script lang="ts">
	import { onDestroy } from 'svelte';
	import { timerAgent, type TimerMode, type TimerState } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import { themeService } from '$lib/services/theme-service';
	import { resolve } from '$app/paths';

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

<nav class="fixed inset-x-0 top-0 z-40">
	<div
		class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
		style={`background-color:${brandColor}; backdrop-filter:saturate(180%) blur(8px);`}
	>
		<a
			href={resolve('/timer')}
			class="flex items-center gap-2 font-semibold tracking-wide text-white"
		>
			<span class="inline-block h-2.5 w-2.5 rounded-full bg-white/90 shadow"></span>
			Pomofocus
		</a>

		<div class="hidden items-center gap-6 text-white/90 md:flex">
			<a href={resolve('/tasks')} class="transition-colors hover:text-white">Tasks</a>
			<a href={resolve('/goals')} class="transition-colors hover:text-white">Goals</a>
			<a href={resolve('/history')} class="transition-colors hover:text-white">History</a>
			<a href={resolve('/stats')} class="transition-colors hover:text-white">Reports</a>
			<a href={resolve('/settings')} class="transition-colors hover:text-white">Settings</a>
		</div>

		<div class="md:hidden">
			<a
				href={resolve('/settings')}
				aria-label="Settings"
				class="text-white/90 transition-colors hover:text-white">⚙️</a
			>
		</div>
	</div>
</nav>

<style>
	nav {
		user-select: none;
	}
</style>

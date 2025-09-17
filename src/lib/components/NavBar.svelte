<script lang="ts">
	import { onDestroy } from 'svelte';
	import { timerAgent, type TimerMode, type TimerState } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import { themeService } from '$lib/services/theme-service';

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

	$: brandColor =
		mode === 'Pomodoro'
			? theme.colors.pomodoro
			: mode === 'ShortBreak'
				? theme.colors.shortBreak
				: theme.colors.longBreak;
</script>

<nav class="fixed inset-x-0 top-0 z-40">
	<div
		class="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8"
		style={`background-color:${brandColor}; backdrop-filter:saturate(180%) blur(8px);`}
	>
		<a href="#timer" class="flex items-center gap-2 font-semibold tracking-wide text-white">
			<span class="inline-block h-2.5 w-2.5 rounded-full bg-white/90 shadow"></span>
			Pomofocus
		</a>

		<div class="hidden items-center gap-6 text-white/90 md:flex">
			<a href="#tasks" class="transition-colors hover:text-white">Tasks</a>
			<a href="#goals" class="transition-colors hover:text-white">Goals</a>
			<a href="#history" class="transition-colors hover:text-white">History</a>
			<a href="#stats" class="transition-colors hover:text-white">Reports</a>
			<a href="#settings" class="transition-colors hover:text-white">Settings</a>
		</div>

		<div class="md:hidden">
			<a
				href="#settings"
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

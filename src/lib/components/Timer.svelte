<script lang="ts">
	import { onDestroy } from 'svelte';
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
	import { settingsAgent, type TimerSettings } from '$lib/stores/settings-agent';
	import BreakActivity from './BreakActivity.svelte';

	type TimerState = {
		currentMode: TimerMode;
		timerStatus: 'running' | 'paused' | 'stopped';
		timeRemaining: number;
	};
	let timerState: TimerState = {
		currentMode: 'Pomodoro',
		timerStatus: 'stopped',
		timeRemaining: 0
	};

	const unsubscribe = timerAgent.subscribe((state) => (timerState = state as TimerState));

	let timerSettings: TimerSettings = settingsAgent.getSetting('timerSettings') as TimerSettings;
	const unsubscribeSettings = settingsAgent.subscribe(() => {
		timerSettings = settingsAgent.getSetting('timerSettings') as TimerSettings;
	});

	onDestroy(() => {
		unsubscribe();
		unsubscribeSettings?.();
	});

	$: timeDisplay = formatTime(timerState.timeRemaining);
	$: currentMode = timerState.currentMode;
	$: timerStatus = timerState.timerStatus;
	$: totalSeconds = (function () {
		const ts = timerSettings;
		switch (currentMode) {
			case 'Pomodoro':
				return (ts?.pomodoro ?? 25) * 60;
			case 'ShortBreak':
				return (ts?.shortBreak ?? 5) * 60;
			case 'LongBreak':
				return (ts?.longBreak ?? 15) * 60;
		}
	})();
	$: progress = Math.max(0, Math.min(1, timerState.timeRemaining / totalSeconds));
	const R = 140; // radius
	const C = 2 * Math.PI * R;

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}

	function handleStartPause() {
		if (timerStatus === 'running') {
			timerAgent.pauseTimer();
		} else {
			timerAgent.startTimer();
		}
	}

	function handleReset() {
		timerAgent.resetTimer();
	}

	function handleSwitchMode(mode: TimerMode) {
		timerAgent.switchMode(mode);
	}
</script>

<div class="timer-container">
	<div class="timer-display">
		<div class="mode-indicator">{currentMode}</div>
		<div class="time-outer">
			<svg class="ring" viewBox="0 0 320 320" width="100%" height="100%" aria-hidden="true">
				<circle class="ring-bg" cx="160" cy="160" r={R} />
				<circle
					class="ring-fg"
					cx="160"
					cy="160"
					r={R}
					stroke-dasharray={C}
					stroke-dashoffset={C - C * progress}
					pathLength={C}
				/>
			</svg>
			<div class="time-display" class:running={timerStatus === 'running'}>
				{timeDisplay}
			</div>
		</div>
	</div>

	<BreakActivity />

	<div class="timer-controls">
		<button
			class="control-btn start-pause"
			onclick={handleStartPause}
			disabled={timerStatus === 'stopped' && timerState?.timeRemaining === 0}
		>
			{timerStatus === 'running' ? 'Pause' : 'Start'}
		</button>
		<button class="control-btn reset" onclick={handleReset}> Reset </button>
	</div>

	<div class="mode-buttons">
		<button
			class="mode-btn"
			class:active={currentMode === 'Pomodoro'}
			onclick={() => handleSwitchMode('Pomodoro')}
		>
			Pomodoro
		</button>
		<button
			class="mode-btn"
			class:active={currentMode === 'ShortBreak'}
			onclick={() => handleSwitchMode('ShortBreak')}
		>
			Short Break
		</button>
		<button
			class="mode-btn"
			class:active={currentMode === 'LongBreak'}
			onclick={() => handleSwitchMode('LongBreak')}
		>
			Long Break
		</button>
	</div>
</div>

<style>
	.timer-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 1.5rem;
		padding: 1.25rem;
		max-width: 520px;
		margin: 0 auto;
	}

	.timer-display {
		text-align: center;
	}

	.mode-indicator {
		font-size: 0.9rem;
		font-weight: 600;
		color: #0f172a;
		margin-bottom: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.12em;
		background: rgba(255, 255, 255, 0.6);
		padding: 0.25rem 0.6rem;
		border-radius: 999px;
		border: 1px solid rgba(16, 24, 40, 0.06);
	}

	.time-outer {
		display: grid;
		place-items: center;
		width: clamp(220px, 40vw, 320px);
		height: clamp(220px, 40vw, 320px);
		border-radius: 999px;
		position: relative;
		background: radial-gradient(
			100% 100% at 50% 0%,
			rgba(255, 255, 255, 0.45),
			rgba(255, 255, 255, 0.15)
		);
		border: 1px solid rgba(16, 24, 40, 0.06);
		box-shadow:
			inset 0 1px 4px rgba(255, 255, 255, 0.5),
			0 20px 40px rgba(0, 0, 0, 0.08);
	}

	.ring {
		position: absolute;
		inset: 0;
		pointer-events: none;
	}
	.ring-bg {
		fill: none;
		stroke: rgba(16, 24, 40, 0.08);
		stroke-width: 14;
	}
	.ring-fg {
		fill: none;
		stroke: var(--ring-color, #0f172a);
		stroke-width: 14;
		stroke-linecap: round;
		transform: rotate(-90deg);
		transform-origin: 50% 50%;
		transition: stroke-dashoffset 0.5s ease;
	}
	.time-display {
		font-size: clamp(3rem, 9vw, 4.5rem);
		font-weight: 800;
		font-family:
			ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
			monospace;
		color: #0b132b;
		transition: color 0.3s ease;
		text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
	}

	.time-display.running {
		color: #111827;
	}

	.timer-controls {
		display: flex;
		gap: 0.75rem;
	}

	.control-btn {
		min-width: 44px;
		min-height: 44px;
		padding: 0.65rem 1.15rem;
		border: none;
		border-radius: 0.75rem;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition:
			transform 0.12s ease,
			box-shadow 0.2s ease,
			background-color 0.2s ease;
		box-shadow: 0 6px 14px rgba(0, 0, 0, 0.12);
	}

	.start-pause {
		background-color: #111827; /* Contrast 21:1 on white */
		color: #ffffff;
	}
	.start-pause:hover:not(:disabled) {
		background-color: #0b1220;
		transform: translateY(-1px);
	}

	.reset {
		background-color: #ffffff;
		color: #0f172a;
		border: 1px solid rgba(16, 24, 40, 0.25);
	}
	.reset:hover {
		background-color: rgba(255, 255, 255, 0.85);
		transform: translateY(-1px);
	}

	.control-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.mode-buttons {
		display: flex;
		gap: 0.5rem;
	}

	.mode-btn {
			min-width: 44px;
			min-height: 44px;
			padding: 0.5rem 0.9rem;
		border: 1px solid rgba(16, 24, 40, 0.12);
		border-radius: 999px;
			background-color: #ffffff;
			color: #0f172a;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

		.control-btn:focus-visible,
		.mode-btn:focus-visible {
			outline: 3px solid #2563eb;
			outline-offset: 2px;
		}

	.mode-btn:hover {
		border-color: rgba(16, 24, 40, 0.25);
		background: rgba(255, 255, 255, 0.9);
	}

	.mode-btn.active {
		border-color: #0f172a;
		background-color: #0f172a;
		color: white;
	}
</style>

<script lang="ts">
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';

	let timerState: { currentMode: TimerMode; timerStatus: string; timeRemaining: number };ang="ts">
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';

	let timerState: any;
	let settings: any;

	timerAgent.subscribe((state) => (timerState = state));
	settingsAgent.subscribe((state) => (settings = state));

	$: timeDisplay = formatTime(timerState?.timeRemaining || 0);
	$: currentMode = timerState?.currentMode || 'Pomodoro';
	$: timerStatus = timerState?.timerStatus || 'stopped';

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
		<div class="time-display" class:running={timerStatus === 'running'}>
			{timeDisplay}
		</div>
	</div>

	<div class="timer-controls">
		<button
			class="control-btn start-pause"
			on:click={handleStartPause}
			disabled={timerStatus === 'stopped' && timerState?.timeRemaining === 0}
		>
			{timerStatus === 'running' ? 'Pause' : 'Start'}
		</button>
		<button class="control-btn reset" on:click={handleReset}> Reset </button>
	</div>

	<div class="mode-buttons">
		<button
			class="mode-btn"
			class:active={currentMode === 'Pomodoro'}
			on:click={() => handleSwitchMode('Pomodoro')}
		>
			Pomodoro
		</button>
		<button
			class="mode-btn"
			class:active={currentMode === 'ShortBreak'}
			on:click={() => handleSwitchMode('ShortBreak')}
		>
			Short Break
		</button>
		<button
			class="mode-btn"
			class:active={currentMode === 'LongBreak'}
			on:click={() => handleSwitchMode('LongBreak')}
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
		gap: 2rem;
		padding: 2rem;
		max-width: 400px;
		margin: 0 auto;
	}

	.timer-display {
		text-align: center;
	}

	.mode-indicator {
		font-size: 1.2rem;
		font-weight: 500;
		color: #666;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	.time-display {
		font-size: 4rem;
		font-weight: 700;
		font-family: 'Courier New', monospace;
		color: #333;
		transition: color 0.3s ease;
	}

	.time-display.running {
		color: #e74c3c;
	}

	.timer-controls {
		display: flex;
		gap: 1rem;
	}

	.control-btn {
		padding: 0.75rem 1.5rem;
		border: none;
		border-radius: 0.5rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.start-pause {
		background-color: #27ae60;
		color: white;
	}

	.start-pause:hover:not(:disabled) {
		background-color: #229954;
	}

	.reset {
		background-color: #95a5a6;
		color: white;
	}

	.reset:hover {
		background-color: #7f8c8d;
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
		padding: 0.5rem 1rem;
		border: 2px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
		color: #666;
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.mode-btn:hover {
		border-color: #bbb;
	}

	.mode-btn.active {
		border-color: #3498db;
		background-color: #3498db;
		color: white;
	}
</style>

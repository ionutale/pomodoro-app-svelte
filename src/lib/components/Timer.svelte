<script lang="ts">
  import { onDestroy } from 'svelte';
  import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';

  type TimerState = { currentMode: TimerMode; timerStatus: 'running' | 'paused' | 'stopped'; timeRemaining: number };
  let timerState: TimerState = { currentMode: 'Pomodoro', timerStatus: 'stopped', timeRemaining: 0 };

  const unsubscribe = timerAgent.subscribe((state) => (timerState = state as TimerState));
  onDestroy(() => unsubscribe());

  $: timeDisplay = formatTime(timerState.timeRemaining);
  $: currentMode = timerState.currentMode;
  $: timerStatus = timerState.timerStatus;

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
		border-radius: 0.75rem;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		transition: transform 0.12s ease, box-shadow 0.2s ease, background-color 0.2s ease;
		box-shadow: 0 2px 6px rgba(0,0,0,0.08);
	}

	.start-pause { background-color: #27ae60; color: white; }
	.start-pause:hover:not(:disabled) { background-color: #229954; transform: translateY(-1px); }

	.reset { background-color: #95a5a6; color: white; }
	.reset:hover { background-color: #7f8c8d; transform: translateY(-1px); }

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

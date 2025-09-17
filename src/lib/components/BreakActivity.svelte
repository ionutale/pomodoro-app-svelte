<script lang="ts">
	import { onDestroy } from 'svelte';
	import { breakActivitiesAgent } from '$lib/stores/break-activities-agent';
	import { timerAgent, type TimerMode } from '$lib/stores/timer-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';

	let currentActivity: any = null;
	let currentMode: TimerMode = 'Pomodoro';
	let isEnabled = true;

	const unsubActivity = breakActivitiesAgent.subscribe((state) => {
		currentActivity = state.currentActivity;
		isEnabled = state.isEnabled;
	});

	const unsubTimer = timerAgent.subscribe((state) => {
		currentMode = state.currentMode;
	});

	const unsubSettings = settingsAgent.subscribe(() => {
		isEnabled = settingsAgent.getSetting('breakActivitiesSettings.enabled') ?? true;
	});

	onDestroy(() => {
		unsubActivity();
		unsubTimer();
		unsubSettings();
	});

	function getCategoryColor(category: string): string {
		switch (category) {
			case 'physical': return '#e74c3c';
			case 'mental': return '#3498db';
			case 'creative': return '#9b59b6';
			case 'social': return '#e67e22';
			case 'relaxation': return '#27ae60';
			default: return '#95a5a6';
		}
	}

	function getCategoryIcon(category: string): string {
		switch (category) {
			case 'physical': return '🏃';
			case 'mental': return '🧠';
			case 'creative': return '🎨';
			case 'social': return '👥';
			case 'relaxation': return '😌';
			default: return '✨';
		}
	}

	function generateNewActivity() {
		breakActivitiesAgent.generateNewActivity();
	}
</script>

{#if isEnabled && currentActivity && (currentMode === 'ShortBreak' || currentMode === 'LongBreak')}
	<div class="break-activity">
		<div class="activity-header">
			<div class="activity-icon" style="background-color: {getCategoryColor(currentActivity.category)}">
				{getCategoryIcon(currentActivity.category)}
			</div>
			<div class="activity-meta">
				<h3>Break Activity</h3>
				<span class="activity-category">{currentActivity.category}</span>
			</div>
			<button class="refresh-button" on:click={generateNewActivity} title="Get another activity">
				🔄
			</button>
		</div>

		<div class="activity-content">
			<h4>{currentActivity.title}</h4>
			<p>{currentActivity.description}</p>

			{#if currentActivity.duration}
				<div class="activity-duration">
					⏱️ Suggested duration: {currentActivity.duration} minute{currentActivity.duration > 1 ? 's' : ''}
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.break-activity {
		background: rgba(255, 255, 255, 0.9);
		border: 2px solid #e0e0e0;
		border-radius: 12px;
		padding: 1.5rem;
		margin: 1rem 0;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.activity-header {
		display: flex;
		align-items: center;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.activity-icon {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		color: white;
		flex-shrink: 0;
	}

	.activity-meta {
		flex: 1;
	}

	.activity-meta h3 {
		margin: 0 0 0.25rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.activity-category {
		font-size: 0.85rem;
		color: #666;
		text-transform: capitalize;
		font-weight: 500;
	}

	.refresh-button {
		background: none;
		border: none;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.5rem;
		border-radius: 50%;
		transition: background-color 0.2s;
		flex-shrink: 0;
	}

	.refresh-button:hover {
		background-color: #f0f0f0;
	}

	.activity-content h4 {
		margin: 0 0 0.75rem 0;
		font-size: 1.2rem;
		color: #333;
		line-height: 1.3;
	}

	.activity-content p {
		margin: 0 0 1rem 0;
		color: #555;
		line-height: 1.5;
		font-size: 0.95rem;
	}

	.activity-duration {
		font-size: 0.9rem;
		color: #666;
		font-weight: 500;
		padding: 0.5rem;
		background-color: #f8f9fa;
		border-radius: 6px;
		display: inline-block;
	}

	@media (max-width: 768px) {
		.break-activity {
			padding: 1rem;
		}

		.activity-header {
			gap: 0.75rem;
		}

		.activity-icon {
			width: 40px;
			height: 40px;
			font-size: 1.2rem;
		}

		.activity-meta h3 {
			font-size: 1rem;
		}

		.activity-content h4 {
			font-size: 1.1rem;
		}
	}
</style>
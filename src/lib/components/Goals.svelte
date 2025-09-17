<script lang="ts">
	import { onDestroy } from 'svelte';
	import { goalsAgent } from '$lib/stores/goals-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';

	type DailyProgress = {
		date: string;
		pomodorosCompleted: number;
		goal: number;
	};

	type WeeklyProgress = {
		weekStart: string;
		pomodorosCompleted: number;
		goal: number;
	};

	type GoalsState = {
		dailyProgress: DailyProgress[];
		weeklyProgress: WeeklyProgress[];
		currentDay: string;
		currentWeek: string;
	};

	let goalsState: GoalsState = {
		dailyProgress: [],
		weeklyProgress: [],
		currentDay: '',
		currentWeek: ''
	};

	const unsubscribe = goalsAgent.subscribe((state) => (goalsState = state));

	onDestroy(() => unsubscribe());

	$: todayProgress = goalsAgent.getTodayProgress();
	$: weekProgress = goalsAgent.getThisWeekProgress();
	$: currentStreak = goalsAgent.getStreak();
	$: goalsEnabled = settingsAgent.getSetting('goalsSettings.enableGoals') ?? true;

	function getProgressPercentage(completed: number, goal: number): number {
		return Math.min((completed / goal) * 100, 100);
	}

	function getProgressColor(completed: number, goal: number): string {
		const percentage = (completed / goal) * 100;
		if (percentage >= 100) return '#27ae60'; // Green
		if (percentage >= 75) return '#f39c12'; // Orange
		return '#e74c3c'; // Red
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
	}

	function formatWeek(weekStart: string): string {
		const start = new Date(weekStart);
		const end = new Date(start);
		end.setDate(start.getDate() + 6);
		return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
	}
</script>

{#if goalsEnabled}
	<div class="goals-container">
		<div class="goals-header">
			<h3>🎯 Goals & Progress</h3>
			{#if currentStreak > 0}
				<div class="streak-badge">
					🔥 {currentStreak} day streak!
				</div>
			{/if}
		</div>

		<div class="goals-grid">
			{#if todayProgress}
				<div class="goal-card daily-goal">
					<div class="goal-header">
						<h4>Today's Goal</h4>
						<span class="goal-date">{formatDate(todayProgress.date)}</span>
					</div>

					<div class="progress-circle">
						<svg width="120" height="120" viewBox="0 0 120 120">
							<circle
								cx="60"
								cy="60"
								r="50"
								stroke="#e0e0e0"
								stroke-width="8"
								fill="none"
							/>
							<circle
								cx="60"
								cy="60"
								r="50"
								stroke={getProgressColor(todayProgress.pomodorosCompleted, todayProgress.goal)}
								stroke-width="8"
								fill="none"
								stroke-dasharray={`${2 * Math.PI * 50}`}
								stroke-dashoffset={`${2 * Math.PI * 50 * (1 - getProgressPercentage(todayProgress.pomodorosCompleted, todayProgress.goal) / 100)}`}
								stroke-linecap="round"
								transform="rotate(-90 60 60)"
							/>
						</svg>
						<div class="progress-text">
							<div class="progress-number">{todayProgress.pomodorosCompleted}</div>
							<div class="progress-total">/ {todayProgress.goal}</div>
						</div>
					</div>

					<div class="goal-status">
						{#if todayProgress.pomodorosCompleted >= todayProgress.goal}
							<span class="goal-achieved">🎉 Goal Achieved!</span>
						{:else}
							<span class="goal-remaining">
								{todayProgress.goal - todayProgress.pomodorosCompleted} more to go
							</span>
						{/if}
					</div>
				</div>
			{/if}

			{#if weekProgress}
				<div class="goal-card weekly-goal">
					<div class="goal-header">
						<h4>Weekly Goal</h4>
						<span class="goal-date">{formatWeek(weekProgress.weekStart)}</span>
					</div>

					<div class="progress-bar">
						<div class="progress-fill" style="width: {getProgressPercentage(weekProgress.pomodorosCompleted, weekProgress.goal)}%; background-color: {getProgressColor(weekProgress.pomodorosCompleted, weekProgress.goal)}"></div>
						<div class="progress-text">
							{weekProgress.pomodorosCompleted} / {weekProgress.goal} pomodoros
						</div>
					</div>

					<div class="goal-status">
						{#if weekProgress.pomodorosCompleted >= weekProgress.goal}
							<span class="goal-achieved">🎉 Weekly Goal Achieved!</span>
						{:else}
							<span class="goal-remaining">
								{weekProgress.goal - weekProgress.pomodorosCompleted} more this week
							</span>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.goals-container {
		margin-bottom: 2rem;
		padding: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
	}

	.goals-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.goals-header h3 {
		margin: 0;
		color: #333;
	}

	.streak-badge {
		background-color: #e74c3c;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 1rem;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.goals-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}

	.goal-card {
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
		background-color: #fafafa;
	}

	.daily-goal {
		border-color: #3498db;
	}

	.weekly-goal {
		border-color: #9b59b6;
	}

	.goal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}

	.goal-header h4 {
		margin: 0;
		color: #333;
		font-size: 1.1rem;
	}

	.goal-date {
		font-size: 0.85rem;
		color: #666;
	}

	.progress-circle {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 1rem 0;
	}

	.progress-circle svg {
		transform: rotate(-90deg);
	}

	.progress-text {
		position: absolute;
		text-align: center;
		font-weight: 600;
		color: #333;
	}

	.progress-number {
		font-size: 2rem;
		line-height: 1;
	}

	.progress-total {
		font-size: 0.9rem;
		color: #666;
		margin-top: 0.25rem;
	}

	.progress-bar {
		position: relative;
		height: 24px;
		background-color: #e0e0e0;
		border-radius: 12px;
		overflow: hidden;
		margin: 1rem 0;
	}

	.progress-fill {
		height: 100%;
		transition: width 0.3s ease;
	}

	.progress-text {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
		font-weight: 600;
		color: #333;
	}

	.goal-status {
		text-align: center;
		margin-top: 1rem;
	}

	.goal-achieved {
		color: #27ae60;
		font-weight: 600;
		font-size: 1rem;
	}

	.goal-remaining {
		color: #666;
		font-size: 0.9rem;
	}

	@media (max-width: 768px) {
		.goals-grid {
			grid-template-columns: 1fr;
		}

		.goals-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
	}
</style>
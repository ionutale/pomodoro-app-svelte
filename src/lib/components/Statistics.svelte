<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sessionHistoryAgent } from '$lib/stores/session-history-agent';
	import { goalsAgent } from '$lib/stores/goals-agent';
	import { getLastNDays, getRangeForTimeRange } from '$lib/utils/date';

	type TimeRange = 'today' | 'week' | 'month' | 'all';

	let timeRange: TimeRange = $state('week');
	let stats = $state<{
		totalSessions?: number;
		pomodoroSessions?: number;
		breakSessions?: number;
		totalFocusTime?: number;
		averageSessionLength?: number;
		completionRate?: number;
		avgDailySessions?: number;
		avgDailyFocusTime?: number;
		todayProgress?: any;
		weekProgress?: any;
		currentStreak?: number;
		totalBreakTime?: number;
	}>({});
	let chartData = $state<{
		labels?: string[];
		datasets?: {
			label: string;
			data: number[];
			backgroundColor: string;
			borderColor: string;
			borderWidth: number;
		}[];
	}>({});

	const unsub = sessionHistoryAgent.subscribe(() => {
		updateStats();
	});

	onDestroy(() => unsub());

	function updateStats() {
		const { start: startDate, end: endDate } = getRangeForTimeRange(timeRange);

		const sessionStats = sessionHistoryAgent.getSessionStats(startDate, endDate);
		const totalFocusTime = sessionHistoryAgent.getTotalFocusTime(startDate, endDate);

		// Calculate additional metrics
		const sessions = sessionHistoryAgent.getSessionsForDateRange(startDate || new Date(0), endDate);
		const pomodoroSessions = sessions.filter((s) => s.mode === 'Pomodoro');
		const breakSessions = sessions.filter((s) => s.mode !== 'Pomodoro');

		// Calculate streaks and goals
		// get streaks and goals from agent

		const todayProgress = goalsAgent.getTodayProgress();
		const weekProgress = goalsAgent.getThisWeekProgress();
		const currentStreak = goalsAgent.getStreak();

		// Calculate completion rate (sessions that reached full duration)
		const completedSessions = pomodoroSessions.filter((s) => s.duration >= 25 * 60); // heuristic
		const completionRate =
			pomodoroSessions.length > 0 ? (completedSessions.length / pomodoroSessions.length) * 100 : 0;

		// Calculate daily averages
		const daysDiff = startDate
			? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
			: 30;
		const avgDailySessions = sessionStats.totalSessions / Math.max(daysDiff, 1);
		const avgDailyFocusTime = totalFocusTime / Math.max(daysDiff, 1);

		Object.assign(stats, {
			...sessionStats,
			totalFocusTime,
			completionRate,
			avgDailySessions,
			avgDailyFocusTime,
			todayProgress,
			weekProgress,
			currentStreak,
			breakSessions: breakSessions.length,
			totalBreakTime: breakSessions.reduce((total, s) => total + s.duration, 0)
		});

		// Generate chart data for the last 7 days
		generateChartData();
	}

	function generateChartData() {
		const last7Days = getLastNDays(7);
		Object.assign(chartData, {
			labels: last7Days.map((date) => date.toLocaleDateString('en-US', { weekday: 'short' })),
			datasets: [
				{
					label: 'Focus Time (minutes)',
					data: last7Days.map((date) => {
						const nextDay = new Date(date.getTime() + 24 * 60 * 60 * 1000);
						const focusTime = sessionHistoryAgent.getTotalFocusTime(date, nextDay);
						return Math.round(focusTime / 60);
					}),
					backgroundColor: 'rgba(52, 152, 219, 0.6)',
					borderColor: 'rgba(52, 152, 219, 1)',
					borderWidth: 1
				}
			]
		});
	}

	function formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);

		if (hours > 0) {
			return `${hours}h ${minutes}m`;
		}
		return `${minutes}m`;
	}

	function formatPercentage(value: number): string {
		return `${Math.round(value)}%`;
	}

	$effect(() => {
		// depend on timeRange implicitly through the function
		updateStats();
	});
</script>

<div class="statistics-dashboard">
	<div class="stats-header">
		<h2>📊 Productivity Statistics</h2>
		<div class="time-range-selector">
			<button class:active={timeRange === 'today'} onclick={() => (timeRange = 'today')}
				>Today</button
			>
			<button class:active={timeRange === 'week'} onclick={() => (timeRange = 'week')}
				>This Week</button
			>
			<button class:active={timeRange === 'month'} onclick={() => (timeRange = 'month')}
				>This Month</button
			>
			<button class:active={timeRange === 'all'} onclick={() => (timeRange = 'all')}
				>All Time</button
			>
		</div>
	</div>

	<div class="stats-grid">
		<div class="stat-card primary">
			<div class="stat-icon">⏱️</div>
			<div class="stat-content">
				<div class="stat-value">{formatDuration(stats.totalFocusTime || 0)}</div>
				<div class="stat-label">Total Focus Time</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🎯</div>
			<div class="stat-content">
				<div class="stat-value">{stats.pomodoroSessions || 0}</div>
				<div class="stat-label">Pomodoro Sessions</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📈</div>
			<div class="stat-content">
				<div class="stat-value">{formatPercentage(stats.completionRate || 0)}</div>
				<div class="stat-label">Completion Rate</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">🔥</div>
			<div class="stat-content">
				<div class="stat-value">{stats.currentStreak || 0}</div>
				<div class="stat-label">Current Streak</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">📊</div>
			<div class="stat-content">
				<div class="stat-value">{formatDuration(Math.round(stats.avgDailyFocusTime || 0))}</div>
				<div class="stat-label">Daily Average</div>
			</div>
		</div>

		<div class="stat-card">
			<div class="stat-icon">⚡</div>
			<div class="stat-content">
				<div class="stat-value">{Math.round(stats.avgDailySessions || 0)}</div>
				<div class="stat-label">Sessions/Day</div>
			</div>
		</div>
	</div>

	{#if stats.todayProgress}
		<div class="goals-section">
			<h4>Today's Progress</h4>
			<div class="goal-progress">
				<div class="goal-item">
					<span class="goal-label"
						>Completed: {stats.todayProgress.pomodorosCompleted} / {stats.todayProgress.goal}</span
					>
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {Math.min(
								(stats.todayProgress.pomodorosCompleted / stats.todayProgress.goal) * 100,
								100
							)}%"
						></div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if stats.weekProgress}
		<div class="goals-section">
			<h4>This Week's Progress</h4>
			<div class="goal-progress">
				<div class="goal-item">
					<span class="goal-label"
						>Completed: {stats.weekProgress.pomodorosCompleted} / {stats.weekProgress.goal}</span
					>
					<div class="progress-bar">
						<div
							class="progress-fill"
							style="width: {Math.min(
								(stats.weekProgress.pomodorosCompleted / stats.weekProgress.goal) * 100,
								100
							)}%"
						></div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<div class="chart-placeholder">
		<h4>Focus Time Trend (Last 7 Days)</h4>
		<div class="chart-container">
			<!-- Simple bar chart representation -->
			<div class="simple-chart">
				{#each chartData.datasets?.[0]?.data || [] as value, i (i)}
					<div class="chart-bar" style="height: {Math.max((value / 120) * 100, 5)}%">
						<div class="bar-value">{value}m</div>
						<div class="bar-label">{chartData.labels?.[i]}</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</div>

<style>
	.statistics-dashboard {
		margin-top: 2rem;
		padding: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
	}

	.stats-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}

	.stats-header h2 {
		margin: 0;
		color: #333;
	}

	.time-range-selector {
		display: flex;
		gap: 0.5rem;
	}

	.time-range-selector button {
		min-height: 44px;
		min-width: 44px;
		padding: 0.5rem 1rem;
		border: 1px solid #cbd5e1;
		background: #ffffff;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
		transition: all 0.2s;
	}

	.time-range-selector button.active {
		background: #2563eb;
		color: #ffffff;
		border-color: #2563eb;
	}

	.time-range-selector button:focus-visible {
		outline: 3px solid #2563eb;
		outline-offset: 2px;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
		margin-bottom: 2rem;
	}

	.stat-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.5rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
		background: #fafafa;
		transition: transform 0.2s;
	}

	.stat-card:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.stat-card.primary {
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-color: #667eea;
	}

	.stat-icon {
		font-size: 2rem;
		flex-shrink: 0;
	}

	.stat-content {
		flex: 1;
	}

	.stat-value {
		font-size: 1.8rem;
		font-weight: 700;
		line-height: 1;
		margin-bottom: 0.25rem;
	}

	.stat-label {
		font-size: 0.9rem;
		opacity: 0.8;
		font-weight: 500;
	}

	.goals-section {
		margin-bottom: 2rem;
		padding: 1rem;
		background: #f8f9fa;
		border-radius: 0.5rem;
	}

	.goals-section h4 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.1rem;
	}

	.goal-progress {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.goal-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.goal-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: #555;
	}

	.progress-bar {
		height: 8px;
		background: #e0e0e0;
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: linear-gradient(90deg, #27ae60, #2ecc71);
		transition: width 0.3s ease;
	}

	.chart-placeholder {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #e0e0e0;
		border-radius: 0.5rem;
		background: #fafafa;
	}

	.chart-placeholder h4 {
		margin: 0 0 1rem 0;
		color: #333;
		font-size: 1.1rem;
	}

	.chart-container {
		height: 200px;
		display: flex;
		align-items: end;
		justify-content: space-between;
		padding: 1rem 0;
	}

	.simple-chart {
		display: flex;
		align-items: end;
		justify-content: space-between;
		width: 100%;
		height: 100%;
		gap: 0.5rem;
	}

	.chart-bar {
		flex: 1;
		background: linear-gradient(180deg, #3498db, #2980b9);
		border-radius: 4px 4px 0 0;
		position: relative;
		display: flex;
		flex-direction: column;
		justify-content: end;
		align-items: center;
		min-height: 20px;
		transition: all 0.3s ease;
	}

	.chart-bar:hover {
		opacity: 0.8;
		transform: scaleY(1.05);
	}

	.bar-value {
		position: absolute;
		top: -25px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #333;
	}

	.bar-label {
		position: absolute;
		bottom: -20px;
		font-size: 0.8rem;
		color: #666;
		font-weight: 500;
	}

	@media (max-width: 768px) {
		.stats-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}

		.time-range-selector {
			width: 100%;
			justify-content: space-between;
		}

		.stats-grid {
			grid-template-columns: 1fr;
		}

		.stat-card {
			padding: 1rem;
		}

		.stat-value {
			font-size: 1.5rem;
		}

		.simple-chart {
			gap: 0.25rem;
		}

		.bar-value,
		.bar-label {
			font-size: 0.7rem;
		}
	}
</style>

<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sessionHistoryAgent } from '$lib/stores/session-history-agent';
	import { goalsAgent } from '$lib/stores/goals-agent';
	import { settingsAgent } from '$lib/stores/settings-agent';

	type TimeRange = 'today' | 'week' | 'month' | 'all';

	let timeRange: TimeRange = 'week';
	let stats: any = {};
	let chartData: any = {};

	const unsub = sessionHistoryAgent.subscribe(() => {
		updateStats();
	});

	onDestroy(() => unsub());

	function updateStats() {
		const now = new Date();
		let startDate: Date | undefined;
		let endDate: Date = now;

		switch (timeRange) {
			case 'today':
				startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
				break;
			case 'week':
				startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				break;
			case 'month':
				startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				break;
			case 'all':
				startDate = undefined;
				break;
		}

		const sessionStats = sessionHistoryAgent.getSessionStats(startDate, endDate);
		const totalFocusTime = sessionHistoryAgent.getTotalFocusTime(startDate, endDate);

		// Calculate additional metrics
		const sessions = sessionHistoryAgent.getSessionsForDateRange(startDate || new Date(0), endDate);
		const pomodoroSessions = sessions.filter((s) => s.mode === 'Pomodoro');
		const breakSessions = sessions.filter((s) => s.mode !== 'Pomodoro');

		// Calculate streaks and goals
		const today = new Date();
		const todayStr = today.toISOString().split('T')[0];
		const weekStart = new Date(today.getTime() - today.getDay() * 24 * 60 * 60 * 1000);
		const weekStartStr = weekStart.toISOString().split('T')[0];

		const todayProgress = goalsAgent.getTodayProgress();
		const weekProgress = goalsAgent.getThisWeekProgress();
		const currentStreak = goalsAgent.getStreak();

		// Calculate completion rate (sessions that reached full duration)
		const completedSessions = pomodoroSessions.filter((s) => s.duration >= 25 * 60); // Assuming 25 min pomodoro
		const completionRate =
			pomodoroSessions.length > 0 ? (completedSessions.length / pomodoroSessions.length) * 100 : 0;

		// Calculate daily averages
		const daysDiff = startDate
			? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
			: 30;
		const avgDailySessions = sessionStats.totalSessions / Math.max(daysDiff, 1);
		const avgDailyFocusTime = totalFocusTime / Math.max(daysDiff, 1);

		stats = {
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
		};

		// Generate chart data for the last 7 days
		generateChartData();
	}

	function generateChartData() {
		const last7Days = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date();
			date.setDate(date.getDate() - i);
			last7Days.push(date);
		}

		chartData = {
			labels: last7Days.map((date) => date.toLocaleDateString('en-US', { weekday: 'short' })),
			datasets: [
				{
					label: 'Focus Time (minutes)',
					data: last7Days.map((date) => {
						const nextDay = new Date(date);
						nextDay.setDate(date.getDate() + 1);
						const focusTime = sessionHistoryAgent.getTotalFocusTime(date, nextDay);
						return Math.round(focusTime / 60); // Convert to minutes
					}),
					backgroundColor: 'rgba(52, 152, 219, 0.6)',
					borderColor: 'rgba(52, 152, 219, 1)',
					borderWidth: 1
				}
			]
		};
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

	$: updateStats(); // Re-run when timeRange changes
</script>

<div class="statistics-dashboard">
	<div class="stats-header">
		<h3>📊 Productivity Statistics</h3>
		<div class="time-range-selector">
			<button class:active={timeRange === 'today'} on:click={() => (timeRange = 'today')}
				>Today</button
			>
			<button class:active={timeRange === 'week'} on:click={() => (timeRange = 'week')}
				>This Week</button
			>
			<button class:active={timeRange === 'month'} on:click={() => (timeRange = 'month')}
				>This Month</button
			>
			<button class:active={timeRange === 'all'} on:click={() => (timeRange = 'all')}
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
				{#each chartData.datasets?.[0]?.data || [] as value, i}
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

	.stats-header h3 {
		margin: 0;
		color: #333;
	}

	.time-range-selector {
		display: flex;
		gap: 0.5rem;
	}

	.time-range-selector button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background: white;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
		transition: all 0.2s;
	}

	.time-range-selector button.active {
		background: #3498db;
		color: white;
		border-color: #3498db;
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

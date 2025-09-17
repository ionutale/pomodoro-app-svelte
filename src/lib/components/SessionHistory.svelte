<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sessionHistoryAgent } from '$lib/stores/session-history-agent';

	type SessionRecord = {
		id: string;
		mode: 'Pomodoro' | 'ShortBreak' | 'LongBreak';
		startTime: Date;
		endTime: Date;
		duration: number;
		taskId?: string | null;
		taskName?: string | null;
	};

	type SessionHistoryState = { sessions: SessionRecord[] };

	let sessionState: SessionHistoryState = { sessions: [] };
	let showHistory = false;
	let filterMode: 'all' | 'Pomodoro' | 'ShortBreak' | 'LongBreak' = 'all';
	let dateRange: 'today' | 'week' | 'month' | 'all' = 'all';

	const unsubscribe = sessionHistoryAgent.subscribe((state) => (sessionState = state));

	onDestroy(() => unsubscribe());

	$: sessions = sessionState.sessions;
	$: filteredSessions = sessions.filter((session) => {
		if (filterMode !== 'all' && session.mode !== filterMode) return false;

		const now = new Date();
		const sessionDate = session.startTime;

		switch (dateRange) {
			case 'today':
				return sessionDate.toDateString() === now.toDateString();
			case 'week':
				const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
				return sessionDate >= weekAgo;
			case 'month':
				const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
				return sessionDate >= monthAgo;
			default:
				return true;
		}
	});

	$: stats = sessionHistoryAgent.getSessionStats();

	function formatDuration(seconds: number): string {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
	}

	function formatDateTime(date: Date): string {
		return date.toLocaleString();
	}

	function getModeColor(mode: string): string {
		switch (mode) {
			case 'Pomodoro':
				return '#e74c3c';
			case 'ShortBreak':
				return '#27ae60';
			case 'LongBreak':
				return '#3498db';
			default:
				return '#95a5a6';
		}
	}
</script>

<div class="session-history-container">
	<button class="history-toggle" on:click={() => (showHistory = !showHistory)}>
		📊 Session History {showHistory ? '▼' : '▶'}
	</button>

	{#if showHistory}
		<div class="history-content">
			<div class="history-header">
				<h3>Session History</h3>
				<div class="filters">
					<label>
						Filter:
						<select bind:value={filterMode}>
							<option value="all">All Sessions</option>
							<option value="Pomodoro">Pomodoros Only</option>
							<option value="ShortBreak">Short Breaks</option>
							<option value="LongBreak">Long Breaks</option>
						</select>
					</label>
					<label>
						Time Range:
						<select bind:value={dateRange}>
							<option value="all">All Time</option>
							<option value="today">Today</option>
							<option value="week">This Week</option>
							<option value="month">This Month</option>
						</select>
					</label>
				</div>
			</div>

			<div class="stats-summary">
				<div class="stat">
					<span class="stat-label">Total Sessions:</span>
					<span class="stat-value">{stats.totalSessions}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Pomodoros:</span>
					<span class="stat-value">{stats.pomodoroSessions}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Total Focus Time:</span>
					<span class="stat-value">{formatDuration(stats.totalFocusTime)}</span>
				</div>
				<div class="stat">
					<span class="stat-label">Avg Session:</span>
					<span class="stat-value">{formatDuration(Math.round(stats.averageSessionLength))}</span>
				</div>
			</div>

			<div class="sessions-list">
				{#each filteredSessions as session (session.id)}
					<div class="session-item" style="border-left-color: {getModeColor(session.mode)}">
						<div class="session-info">
							<div class="session-mode" style="color: {getModeColor(session.mode)}">
								{session.mode}
							</div>
							<div class="session-time">
								{formatDateTime(session.startTime)}
							</div>
							<div class="session-duration">
								Duration: {formatDuration(session.duration)}
							</div>
							{#if session.taskName}
								<div class="session-task">
									Task: {session.taskName}
								</div>
							{/if}
						</div>
					</div>
				{/each}
				{#if filteredSessions.length === 0}
					<div class="no-sessions">No sessions found for the selected filters.</div>
				{/if}
			</div>

			{#if sessions.length > 0}
				<div class="history-actions">
					<button on:click={() => sessionHistoryAgent.clearHistory()}> Clear History </button>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.session-history-container {
		margin-top: 2rem;
		max-width: 800px;
	}

	.history-toggle {
		width: 100%;
		padding: 0.75rem 1rem;
		background-color: #f8f9fa;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: background-color 0.2s ease;
	}

	.history-toggle:hover {
		background-color: #e9ecef;
	}

	.history-content {
		margin-top: 1rem;
		padding: 1.5rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
	}

	.history-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.history-header h3 {
		margin: 0;
		color: #333;
	}

	.filters {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.filters label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.filters select {
		padding: 0.25rem 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		font-size: 0.9rem;
	}

	.stats-summary {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
		margin-bottom: 1.5rem;
		padding: 1rem;
		background-color: #f8f9fa;
		border-radius: 0.5rem;
	}

	.stat {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}

	.stat-label {
		font-size: 0.8rem;
		color: #666;
		margin-bottom: 0.25rem;
	}

	.stat-value {
		font-size: 1.2rem;
		font-weight: 600;
		color: #333;
	}

	.sessions-list {
		max-height: 400px;
		overflow-y: auto;
		border: 1px solid #eee;
		border-radius: 0.5rem;
	}

	.session-item {
		display: flex;
		padding: 1rem;
		border-left: 4px solid;
		border-bottom: 1px solid #f0f0f0;
		background-color: white;
		transition: background-color 0.2s ease;
	}

	.session-item:hover {
		background-color: #f8f9fa;
	}

	.session-item:last-child {
		border-bottom: none;
	}

	.session-info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.session-mode {
		font-weight: 600;
		font-size: 1rem;
	}

	.session-time {
		font-size: 0.85rem;
		color: #666;
	}

	.session-duration {
		font-size: 0.9rem;
		color: #333;
	}

	.session-task {
		font-size: 0.85rem;
		color: #27ae60;
		font-style: italic;
	}

	.no-sessions {
		padding: 2rem;
		text-align: center;
		color: #666;
		font-style: italic;
	}

	.history-actions {
		margin-top: 1rem;
		display: flex;
		justify-content: center;
	}

	.history-actions button {
		padding: 0.5rem 1rem;
		border: 1px solid #e74c3c;
		background-color: white;
		color: #e74c3c;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.history-actions button:hover {
		background-color: #e74c3c;
		color: white;
	}
</style>

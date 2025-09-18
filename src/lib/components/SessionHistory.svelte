<script lang="ts">
	import { onDestroy } from 'svelte';
	import { sessionHistoryAgent } from '$lib/stores/session-history-agent';
	import {
		isInRange,
		formatDateTimeDisplay,
		formatDurationDisplay,
		type TimeRange
	} from '$lib/utils/date';

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
	let showHistory = $state(false);
	let filterMode = $state<'all' | 'Pomodoro' | 'ShortBreak' | 'LongBreak'>('all');
	let dateRange = $state<TimeRange>('all');

	let unsubscribe: (() => void) | null = null;
	$effect(() => {
		unsubscribe?.();
		unsubscribe = sessionHistoryAgent.subscribe((state) => (sessionState = state));
		return () => unsubscribe?.();
	});

	let sessions = $derived(sessionState.sessions);
	let filteredSessions = $derived(
		sessions.filter((session) => {
			if (filterMode !== 'all' && session.mode !== filterMode) return false;
			return isInRange(session.startTime, dateRange);
		})
	);

	let stats = $derived(sessionHistoryAgent.getSessionStats());

	const formatDuration = (seconds: number) => formatDurationDisplay(seconds);
	const formatDateTime = (date: Date) => formatDateTimeDisplay(date);

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
	<button class="history-toggle" onclick={() => (showHistory = !showHistory)}>
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
					<button onclick={() => sessionHistoryAgent.clearHistory()}> Clear History </button>
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
		min-height: 44px;
		padding: 0.75rem 1rem;
		background-color: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 0.5rem;
		cursor: pointer;
		font-size: 1rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: background-color 0.2s ease;
	}

	.history-toggle:hover {
		background-color: #f8fafc;
	}

	.history-content {
		margin-top: 1rem;
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
		background-color: #ffffff;
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
		min-height: 44px;
		padding: 0.25rem 0.5rem;
		border: 1px solid #cbd5e1;
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
		border: 1px solid #e2e8f0;
		border-radius: 0.5rem;
	}

	.session-item {
		display: flex;
		padding: 1rem;
		border-left: 4px solid;
		border-bottom: 1px solid #e2e8f0;
		background-color: #ffffff;
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
		min-height: 44px;
		padding: 0.5rem 1rem;
		border: 1px solid #b91c1c;
		background-color: #ffffff;
		color: #b91c1c;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.95rem;
		font-weight: 600;
	}

	.history-actions button:hover {
		background-color: #dc2626;
		color: #ffffff;
		border-color: #dc2626;
	}

	.history-toggle:focus-visible,
	.filters select:focus-visible,
	.history-actions button:focus-visible {
		outline: 3px solid #2563eb;
		outline-offset: 2px;
	}
</style>

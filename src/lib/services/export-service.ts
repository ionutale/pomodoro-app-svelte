import { sessionHistoryAgent } from '../stores/session-history-agent';
import { settingsAgent } from '../stores/settings-agent';
import { goalsAgent } from '../stores/goals-agent';
import type { SessionRecord } from '../stores/session-history-agent';

export type ExportFormat = 'csv' | 'json' | 'pdf';

export interface ExportOptions {
	format: ExportFormat;
	dataTypes: ('sessions' | 'statistics' | 'settings' | 'goals')[];
	dateRange?: {
		start: Date;
		end: Date;
	};
}

export interface ExportData {
	exportedAt: string;
	dateRange?: {
		start: string;
		end: string;
	} | null;
	sessions?: SessionRecord[];
	statistics?: {
		totalSessions: number;
		pomodoroSessions: number;
		breakSessions: number;
		totalFocusTime: number;
		averageSessionLength: number;
	};
	settings?: Record<string, unknown>;
	goals?: {
		todayProgress: unknown;
		weekProgress: unknown;
		currentStreak: number;
	};
}

export class ExportService {
	private static instance: ExportService;

	public static getInstance(): ExportService {
		if (!ExportService.instance) {
			ExportService.instance = new ExportService();
		}
		return ExportService.instance;
	}

	async exportData(options: ExportOptions): Promise<void> {
		const { format, dataTypes, dateRange } = options;

		const exportData: ExportData = {
			exportedAt: new Date().toISOString(),
			dateRange: dateRange
				? {
						start: dateRange.start.toISOString(),
						end: dateRange.end.toISOString()
					}
				: null
		};

		// Collect data based on selected types
		if (dataTypes.includes('sessions')) {
			const sessions = dateRange
				? sessionHistoryAgent.getSessionsForDateRange(dateRange.start, dateRange.end)
				: sessionHistoryAgent.getSessionsForDateRange(new Date(0), new Date());
			exportData.sessions = sessions;
		}

		if (dataTypes.includes('statistics')) {
			const stats = sessionHistoryAgent.getSessionStats(dateRange?.start, dateRange?.end);
			const totalFocusTime = sessionHistoryAgent.getTotalFocusTime(
				dateRange?.start,
				dateRange?.end
			);
			exportData.statistics = {
				...stats,
				totalFocusTime
			};
		}

		if (dataTypes.includes('settings')) {
			exportData.settings = settingsAgent.getSetting('') || {};
		}

		if (dataTypes.includes('goals')) {
			exportData.goals = {
				todayProgress: goalsAgent.getTodayProgress(),
				weekProgress: goalsAgent.getThisWeekProgress(),
				currentStreak: goalsAgent.getStreak()
			};
		}

		// Generate file based on format
		switch (format) {
			case 'csv':
				this.exportAsCSV(exportData);
				break;
			case 'json':
				this.exportAsJSON(exportData);
				break;
			case 'pdf':
				await this.exportAsPDF(exportData);
				break;
		}
	}

	private exportAsCSV(data: ExportData): void {
		let csvContent = '';

		// Export sessions as CSV
		if (data.sessions && data.sessions.length > 0) {
			csvContent += 'Sessions\n';
			csvContent += 'ID,Mode,Start Time,End Time,Duration (seconds),Task ID,Task Name\n';

			data.sessions.forEach((session: SessionRecord) => {
				csvContent += `${session.id},${session.mode},${session.startTime.toISOString()},${session.endTime.toISOString()},${session.duration},${session.taskId || ''},${session.taskName || ''}\n`;
			});

			csvContent += '\n';
		}

		// Export statistics as CSV
		if (data.statistics) {
			csvContent += 'Statistics\n';
			csvContent += 'Metric,Value\n';
			csvContent += `Total Sessions,${data.statistics.totalSessions}\n`;
			csvContent += `Pomodoro Sessions,${data.statistics.pomodoroSessions}\n`;
			csvContent += `Break Sessions,${data.statistics.breakSessions}\n`;
			csvContent += `Total Focus Time (seconds),${data.statistics.totalFocusTime}\n`;
			csvContent += `Average Session Length (seconds),${Math.round(data.statistics.averageSessionLength)}\n`;
		}

		this.downloadFile(csvContent, 'pomodoro-data.csv', 'text/csv');
	}

	private exportAsJSON(data: ExportData): void {
		const jsonContent = JSON.stringify(data, null, 2);
		this.downloadFile(jsonContent, 'pomodoro-data.json', 'application/json');
	}

	private async exportAsPDF(data: ExportData): Promise<void> {
		// For PDF export, we'll create a simple HTML-based PDF
		// In a real implementation, you might use a library like jsPDF or Puppeteer

		let htmlContent = `
			<!DOCTYPE html>
			<html>
			<head>
				<title>Pomodoro Timer Export</title>
				<style>
					body { font-family: Arial, sans-serif; margin: 20px; }
					h1 { color: #333; }
					h2 { color: #666; margin-top: 30px; }
					table { border-collapse: collapse; width: 100%; margin: 10px 0; }
					th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
					th { background-color: #f2f2f2; }
					.stats { background-color: #f9f9f9; padding: 15px; border-radius: 5px; }
				</style>
			</head>
			<body>
				<h1>Pomodoro Timer Export</h1>
				<p><strong>Exported:</strong> ${new Date(data.exportedAt).toLocaleString()}</p>
		`;

		if (data.dateRange) {
			htmlContent += `<p><strong>Date Range:</strong> ${new Date(data.dateRange.start).toLocaleDateString()} - ${new Date(data.dateRange.end).toLocaleDateString()}</p>`;
		}

		// Add statistics
		if (data.statistics) {
			htmlContent += `
				<h2>Statistics</h2>
				<div class="stats">
					<p><strong>Total Sessions:</strong> ${data.statistics.totalSessions}</p>
					<p><strong>Pomodoro Sessions:</strong> ${data.statistics.pomodoroSessions}</p>
					<p><strong>Break Sessions:</strong> ${data.statistics.breakSessions}</p>
					<p><strong>Total Focus Time:</strong> ${this.formatDuration(data.statistics.totalFocusTime)}</p>
					<p><strong>Average Session Length:</strong> ${this.formatDuration(Math.round(data.statistics.averageSessionLength))}</p>
				</div>
			`;
		}

		// Add sessions table
		if (data.sessions && data.sessions.length > 0) {
			htmlContent += `
				<h2>Sessions</h2>
				<table>
					<thead>
						<tr>
							<th>Mode</th>
							<th>Start Time</th>
							<th>Duration</th>
							<th>Task</th>
						</tr>
					</thead>
					<tbody>
			`;

			data.sessions.forEach((session: SessionRecord) => {
				htmlContent += `
					<tr>
						<td>${session.mode}</td>
						<td>${new Date(session.startTime).toLocaleString()}</td>
						<td>${this.formatDuration(session.duration)}</td>
						<td>${session.taskName || session.taskId || '-'}</td>
					</tr>
				`;
			});

			htmlContent += `
					</tbody>
				</table>
			`;
		}

		htmlContent += `
			</body>
			</html>
		`;

		// Create a blob and download as HTML (which can be opened in browser and printed as PDF)
		this.downloadFile(htmlContent, 'pomodoro-data.html', 'text/html');
	}

	private formatDuration(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		if (hours > 0) {
			return `${hours}h ${minutes}m ${secs}s`;
		} else if (minutes > 0) {
			return `${minutes}m ${secs}s`;
		}
		return `${secs}s`;
	}

	private downloadFile(content: string, filename: string, mimeType: string): void {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);

		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);

		URL.revokeObjectURL(url);
	}
}

export const exportService = ExportService.getInstance();

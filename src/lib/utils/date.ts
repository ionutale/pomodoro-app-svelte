export type TimeRange = 'today' | 'week' | 'month' | 'all';

export function formatDateDisplay(dateString: string, locale = 'en-US'): string {
	const date = new Date(dateString);
	return date.toLocaleDateString(locale, { weekday: 'long', month: 'short', day: 'numeric' });
}

export function formatWeekRangeDisplay(weekStart: string, locale = 'en-US'): string {
	const start = new Date(weekStart);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	const startStr = start.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
	const endStr = end.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
	return `${startStr} - ${endStr}`;
}

export function formatDateTimeDisplay(date: Date, locale = 'en-US'): string {
	return date.toLocaleString(locale);
}

export function formatDurationDisplay(seconds: number): string {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function getRangeForTimeRange(
	timeRange: TimeRange,
	now: Date = new Date()
): {
	start?: Date;
	end: Date;
} {
	let start: Date | undefined;
	switch (timeRange) {
		case 'today':
			start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
			break;
		case 'week':
			start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		case 'month':
			start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		case 'all':
			start = undefined;
			break;
	}
	return { start, end: now };
}

export function isInRange(date: Date, timeRange: TimeRange, now: Date = new Date()): boolean {
	switch (timeRange) {
		case 'today':
			return date.toDateString() === now.toDateString();
		case 'week': {
			const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
			return date >= weekAgo;
		}
		case 'month': {
			const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
			return date >= monthAgo;
		}
		case 'all':
		default:
			return true;
	}
}

export function getLastNDays(n: number, now: Date = new Date()): Date[] {
	const days: Date[] = [];
	for (let i = n - 1; i >= 0; i--) {
		const d = new Date(now);
		d.setDate(now.getDate() - i);
		d.setHours(0, 0, 0, 0);
		days.push(d);
	}
	return days;
}

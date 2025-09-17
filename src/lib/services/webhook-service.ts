import { settingsAgent } from '../stores/settings-agent';

export type WebhookEvent = 'sessionStart' | 'sessionEnd' | 'breakStart';

export interface WebhookPayload {
	event: WebhookEvent;
	mode: 'Pomodoro' | 'ShortBreak' | 'LongBreak';
	timestamp: string;
	duration: number; // in seconds
	sessionId?: string;
}

export class WebhookService {
	private static instance: WebhookService;

	public static getInstance(): WebhookService {
		if (!WebhookService.instance) {
			WebhookService.instance = new WebhookService();
		}
		return WebhookService.instance;
	}

	async sendWebhook(
		event: WebhookEvent,
		mode: 'Pomodoro' | 'ShortBreak' | 'LongBreak',
		duration: number,
		sessionId?: string
	): Promise<void> {
		const integrationSettings = settingsAgent.getSetting('integrationSettings') as {
			webhookEnabled?: boolean;
			webhookUrl?: string | null;
			webhookEvents?: WebhookEvent[];
		};

		// Check if webhooks are enabled
		if (!integrationSettings?.webhookEnabled) {
			return;
		}

		// Check if this event type is enabled
		if (!integrationSettings?.webhookEvents?.includes(event)) {
			return;
		}

		// Check if webhook URL is configured
		const webhookUrl = integrationSettings?.webhookUrl;
		if (!webhookUrl) {
			return;
		}

		const payload: WebhookPayload = {
			event,
			mode,
			timestamp: new Date().toISOString(),
			duration,
			sessionId
		};

		try {
			const response = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Pomodoro-App/1.0'
				},
				body: JSON.stringify(payload)
			});

			if (!response.ok) {
				console.warn(`Webhook failed with status ${response.status}: ${response.statusText}`);
			} else {
				console.log(`Webhook sent successfully for ${event} event`);
			}
		} catch (error) {
			console.warn('Failed to send webhook:', error);
		}
	}

	async testWebhook(url: string): Promise<{ success: boolean; error?: string }> {
		const testPayload: WebhookPayload = {
			event: 'sessionEnd',
			mode: 'Pomodoro',
			timestamp: new Date().toISOString(),
			duration: 1500, // 25 minutes
			sessionId: 'test-session'
		};

		try {
			const response = await fetch(url, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'User-Agent': 'Pomodoro-App/1.0'
				},
				body: JSON.stringify(testPayload)
			});

			if (response.ok) {
				return { success: true };
			} else {
				return {
					success: false,
					error: `HTTP ${response.status}: ${response.statusText}`
				};
			}
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			};
		}
	}
}

export const webhookService = WebhookService.getInstance();

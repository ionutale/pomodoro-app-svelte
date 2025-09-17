// Simple audio helpers for browser only usage

let ctx: AudioContext | null = null;

function ensureCtx() {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const W = window as unknown as {
			AudioContext: typeof AudioContext;
			webkitAudioContext?: typeof AudioContext;
		};
		ctx = new (W.AudioContext || W.webkitAudioContext!)();
	}
	return ctx;
}

export async function playBeep(durationMs = 400, freq = 880, volume = 0.3) {
	const audio = ensureCtx();
	if (!audio) return;
	const osc = audio.createOscillator();
	const gain = audio.createGain();
	osc.frequency.value = freq;
	gain.gain.value = volume;
	osc.connect(gain);
	gain.connect(audio.destination);
	osc.start();
	await new Promise((r) => setTimeout(r, durationMs));
	osc.stop();
}

// Play an audio file (preferred over oscillator)
export async function playAudioFile(url: string, volume = 0.5) {
	if (typeof window === 'undefined') return;
	return new Promise<void>((resolve) => {
		const audio = new Audio(url);
		audio.volume = volume;
		audio.addEventListener('ended', () => resolve());
		audio.addEventListener('error', () => resolve());
		audio.play().catch(() => resolve());
	});
}

export async function playAlarmFile(urls: string[], repeat = 1, volume = 0.5) {
	for (let i = 0; i < repeat; i++) {
		const url = urls[i % urls.length];
		await playAudioFile(url, volume);
		if (i < repeat - 1) await new Promise((r) => setTimeout(r, 150));
	}
}

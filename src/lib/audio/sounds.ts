// Simple audio helpers for browser only usage

let ctx: AudioContext | null = null;

function ensureCtx() {
	if (typeof window === 'undefined') return null;
	if (!ctx) {
		const W = window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
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

export async function playAlarm(repeat = 1, volume = 0.5) {
	for (let i = 0; i < repeat; i++) {
		await playBeep(350, 1000, volume);
		if (i < repeat - 1) await new Promise((r) => setTimeout(r, 150));
	}
}

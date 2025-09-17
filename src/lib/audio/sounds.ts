// Simple audio helpers for browser only usage

let ctx: AudioContext | null = null;
let tickingAudio: HTMLAudioElement | null = null;
let tickingInterval: number | null = null;

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

// Ticking sound management
export function startTickingSound(soundType: string, volume = 0.5) {
	if (typeof window === 'undefined') return;

	stopTickingSound(); // Stop any existing ticking

	if (soundType === 'None') return;

	// Create audio element for looping
	tickingAudio = new Audio();
	tickingAudio.volume = volume;
	tickingAudio.loop = true;

	// Map sound types to files
	const soundMap: Record<string, string> = {
		'Ticking Fast': '/sounds/ticking-fast.mp3',
		'Ticking Slow': '/sounds/ticking-slow.mp3',
		'White Noise': '/sounds/white-noise.mp3',
		'Brown Noise': '/sounds/brown-noise.mp3'
	};

	const soundUrl = soundMap[soundType];
	if (soundUrl) {
		tickingAudio.src = soundUrl;
		tickingAudio.play().catch(() => {
			// Fallback to generated ticking if file doesn't exist
			startGeneratedTicking(volume);
		});
	} else {
		// Fallback to generated ticking
		startGeneratedTicking(volume);
	}
}

export function stopTickingSound() {
	if (tickingAudio) {
		tickingAudio.pause();
		tickingAudio = null;
	}

	if (tickingInterval) {
		clearInterval(tickingInterval);
		tickingInterval = null;
	}
}

function startGeneratedTicking(volume = 0.5) {
	const audio = ensureCtx();
	if (!audio) return;

	tickingInterval = window.setInterval(() => {
		const osc = audio.createOscillator();
		const gain = audio.createGain();
		osc.frequency.value = 1000; // High pitched tick
		gain.gain.value = volume * 0.1; // Very quiet
		osc.connect(gain);
		gain.connect(audio.destination);
		osc.start();
		osc.stop(audio.currentTime + 0.05); // 50ms tick
	}, 1000); // Every second
}

export function updateTickingVolume(volume: number) {
	if (tickingAudio) {
		tickingAudio.volume = volume;
	}
}

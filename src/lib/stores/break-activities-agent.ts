import { writable } from 'svelte/store';
import { settingsAgent } from './settings-agent';

export interface BreakActivity {
	id: string;
	title: string;
	description: string;
	category: 'physical' | 'mental' | 'creative' | 'social' | 'relaxation';
	duration?: number; // in minutes, optional
}

export interface BreakActivitiesState {
	activities: BreakActivity[];
	currentActivity: BreakActivity | null;
	isEnabled: boolean;
}

const defaultActivities: BreakActivity[] = [
	{
		id: 'stretch',
		title: 'Stretch Your Body',
		description:
			'Stand up and do some simple stretches - reach for the sky, touch your toes, roll your shoulders.',
		category: 'physical',
		duration: 2
	},
	{
		id: 'walk',
		title: 'Take a Short Walk',
		description: 'Step away from your desk and take a 2-3 minute walk around your space.',
		category: 'physical',
		duration: 3
	},
	{
		id: 'deep-breathing',
		title: 'Deep Breathing Exercise',
		description: 'Close your eyes and take 10 slow, deep breaths. Focus on your breathing.',
		category: 'relaxation',
		duration: 2
	},
	{
		id: 'meditation',
		title: 'Quick Meditation',
		description: 'Sit comfortably, close your eyes, and focus on being present for 2 minutes.',
		category: 'mental',
		duration: 2
	},
	{
		id: 'drink-water',
		title: 'Hydrate',
		description: 'Drink a glass of water and stay hydrated throughout your work session.',
		category: 'physical'
	},
	{
		id: 'eye-exercise',
		title: 'Eye Exercises',
		description:
			'Look at a distant object for 20 seconds, then close your eyes and relax for 20 seconds.',
		category: 'physical',
		duration: 1
	},
	{
		id: 'gratitude',
		title: 'Practice Gratitude',
		description: "Think of 3 things you're grateful for today. Write them down if you like.",
		category: 'mental',
		duration: 2
	},
	{
		id: 'desk-cleanup',
		title: 'Clean Your Workspace',
		description:
			'Quickly organize your desk, throw away trash, and create a clean work environment.',
		category: 'physical',
		duration: 3
	},
	{
		id: 'listen-music',
		title: 'Listen to Music',
		description: 'Put on your favorite song or playlist and enjoy some music during your break.',
		category: 'relaxation'
	},
	{
		id: 'doodle',
		title: 'Doodle or Sketch',
		description: 'Grab a pen and paper and doodle whatever comes to mind - no skill required!',
		category: 'creative',
		duration: 3
	},
	{
		id: 'call-friend',
		title: 'Call a Friend',
		description: 'Reach out to a friend or family member for a quick chat.',
		category: 'social'
	},
	{
		id: 'nature-gaze',
		title: 'Look at Nature',
		description: 'Step outside or look out a window at nature, trees, sky, or any natural scenery.',
		category: 'relaxation',
		duration: 2
	},
	{
		id: 'positive-affirmation',
		title: 'Positive Affirmations',
		description:
			'Repeat positive affirmations to yourself: "I am capable, focused, and productive."',
		category: 'mental',
		duration: 1
	},
	{
		id: 'desk-yoga',
		title: 'Desk Yoga',
		description:
			'Try simple yoga poses at your desk: seated cat-cow, seated twists, or neck rolls.',
		category: 'physical',
		duration: 3
	},
	{
		id: 'read-quote',
		title: 'Read an Inspirational Quote',
		description: 'Find and read an inspirational quote to motivate you for the next work session.',
		category: 'mental',
		duration: 2
	}
];

const STORAGE_KEY = 'pomodoro-break-activities';

function loadBreakActivitiesFromStorage(): BreakActivitiesState {
	if (typeof window === 'undefined') {
		return {
			activities: defaultActivities,
			currentActivity: null,
			isEnabled: true
		};
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			return {
				...parsed,
				activities: parsed.activities || defaultActivities
			};
		}
	} catch (error) {
		console.warn('Failed to load break activities from localStorage:', error);
	}

	return {
		activities: defaultActivities,
		currentActivity: null,
		isEnabled: true
	};
}

function saveBreakActivitiesToStorage(state: BreakActivitiesState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save break activities to localStorage:', error);
	}
}

function createBreakActivitiesAgent() {
	const initialState = loadBreakActivitiesFromStorage();
	const { subscribe, update } = writable<BreakActivitiesState>(initialState);

	// Save to localStorage when state changes
	subscribe((state) => {
		saveBreakActivitiesToStorage(state);
	});

	function getRandomActivity(): BreakActivity | null {
		const state = initialState;
		if (!state.isEnabled || state.activities.length === 0) {
			return null;
		}

		const randomIndex = Math.floor(Math.random() * state.activities.length);
		return state.activities[randomIndex];
	}

	function setCurrentActivity(activity: BreakActivity | null): void {
		update((state) => ({
			...state,
			currentActivity: activity
		}));
	}

	function generateNewActivity(): void {
		const activity = getRandomActivity();
		setCurrentActivity(activity);
	}

	function toggleEnabled(): void {
		update((state) => ({
			...state,
			isEnabled: !state.isEnabled
		}));
	}

	function addCustomActivity(activity: Omit<BreakActivity, 'id'>): void {
		const newActivity: BreakActivity = {
			...activity,
			id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
		};

		update((state) => ({
			...state,
			activities: [...state.activities, newActivity]
		}));
	}

	function removeActivity(activityId: string): void {
		update((state) => ({
			...state,
			activities: state.activities.filter((a) => a.id !== activityId)
		}));
	}

	// Update enabled state when settings change
	settingsAgent.subscribe((settings) => {
		const breakActivitiesEnabled = settings.breakActivitiesSettings?.enabled ?? true;
		update((state) => ({
			...state,
			isEnabled: breakActivitiesEnabled
		}));
	});

	return {
		subscribe,
		getRandomActivity,
		setCurrentActivity,
		generateNewActivity,
		toggleEnabled,
		addCustomActivity,
		removeActivity
	};
}

export const breakActivitiesAgent = createBreakActivitiesAgent();

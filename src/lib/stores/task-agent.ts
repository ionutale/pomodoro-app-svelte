import { writable } from 'svelte/store';

export interface Task {
	id: string;
	name: string;
	estimatedPomodoros: number;
	actualPomodoros: number;
	isComplete: boolean;
	note?: string | null;
	dueDate?: Date | null;
	externalId?: string | null;
}

export interface TaskTemplate {
	id: string;
	name: string;
	estimatedPomodoros: number;
	note?: string | null;
}

export interface TaskState {
	taskList: Task[];
	activeTaskId: string | null;
	templates: TaskTemplate[];
}

const STORAGE_KEY = 'pomodoro-tasks';

function loadTasksFromStorage(): TaskState {
	if (typeof window === 'undefined') {
		return { taskList: [], activeTaskId: null, templates: [] };
	}

	try {
		const stored = localStorage.getItem(STORAGE_KEY);
		if (stored) {
			const parsed = JSON.parse(stored);
			// Convert date strings back to Date objects
			const taskList =
				parsed.taskList?.map((task: Task & { dueDate?: string }) => ({
					...task,
					dueDate: task.dueDate ? new Date(task.dueDate) : null
				})) || [];
			return {
				taskList,
				activeTaskId: parsed.activeTaskId || null,
				templates: parsed.templates || []
			};
		}
	} catch (error) {
		console.warn('Failed to load tasks from localStorage:', error);
	}

	return { taskList: [], activeTaskId: null, templates: [] };
}

function saveTasksToStorage(state: TaskState): void {
	if (typeof window === 'undefined') return;

	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	} catch (error) {
		console.warn('Failed to save tasks to localStorage:', error);
	}
}

function createTaskAgent() {
	const initialState = loadTasksFromStorage();
	const { subscribe, update } = writable<TaskState>(initialState);

	let currentState = initialState;

	// Keep currentState in sync and save to localStorage
	subscribe((state) => {
		currentState = state;
		saveTasksToStorage(state);
	});

	function generateId(): string {
		return `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	function addTask(name: string, estimatedPomodoros: number = 1): string {
		const newTask: Task = {
			id: generateId(),
			name,
			estimatedPomodoros,
			actualPomodoros: 0,
			isComplete: false,
			note: null,
			dueDate: null,
			externalId: null
		};

		update((state) => ({
			...state,
			taskList: [...state.taskList, newTask]
		}));

		return newTask.id;
	}

	function updateTask(
		taskId: string,
		updates: Partial<Pick<Task, 'name' | 'estimatedPomodoros' | 'note' | 'dueDate'>>
	): void {
		update((state) => ({
			...state,
			taskList: state.taskList.map((task) => (task.id === taskId ? { ...task, ...updates } : task))
		}));
	}

	function deleteTask(taskId: string): void {
		update((state) => ({
			...state,
			taskList: state.taskList.filter((task) => task.id !== taskId),
			activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId
		}));
	}

	function toggleTaskCompletion(taskId: string): void {
		update((state) => ({
			...state,
			taskList: state.taskList.map((task) =>
				task.id === taskId ? { ...task, isComplete: !task.isComplete } : task
			),
			activeTaskId: state.activeTaskId === taskId ? null : state.activeTaskId
		}));
	}

	function setActiveTask(taskId: string | null): void {
		update((state) => {
			// If setting to null or the task doesn't exist/is complete, allow it
			if (taskId === null) {
				return { ...state, activeTaskId: null };
			}

			const task = state.taskList.find((t) => t.id === taskId);
			if (!task || task.isComplete) {
				return state; // Don't set active if task is complete or doesn't exist
			}

			return { ...state, activeTaskId: taskId };
		});
	}

	function incrementEstimate(taskId: string): void {
		update((state) => ({
			...state,
			taskList: state.taskList.map((task) =>
				task.id === taskId ? { ...task, estimatedPomodoros: task.estimatedPomodoros + 1 } : task
			)
		}));
	}

	function decrementEstimate(taskId: string): void {
		update((state) => ({
			...state,
			taskList: state.taskList.map((task) =>
				task.id === taskId && task.estimatedPomodoros > 0
					? { ...task, estimatedPomodoros: task.estimatedPomodoros - 1 }
					: task
			)
		}));
	}

	function clearFinishedTasks(): void {
		update((state) => ({
			...state,
			taskList: state.taskList.filter((task) => !task.isComplete),
			activeTaskId:
				state.activeTaskId && state.taskList.find((t) => t.id === state.activeTaskId)?.isComplete
					? null
					: state.activeTaskId
		}));
	}

	function clearAllTasks(): void {
		update((state) => ({
			...state,
			taskList: [],
			activeTaskId: null
		}));
	}

	function incrementActualPomodoros(taskId: string): void {
		update((state) => ({
			...state,
			taskList: state.taskList.map((task) =>
				task.id === taskId ? { ...task, actualPomodoros: task.actualPomodoros + 1 } : task
			)
		}));
	}

	function saveAsTemplate(task: Task): string {
		const template: TaskTemplate = {
			id: generateId(),
			name: task.name,
			estimatedPomodoros: task.estimatedPomodoros,
			note: task.note
		};

		update((state) => ({
			...state,
			templates: [...state.templates, template]
		}));

		return template.id;
	}

	function createTaskFromTemplate(templateId: string): string | null {
		const state = currentState;
		const template = state.templates.find((t) => t.id === templateId);
		if (!template) return null;

		return addTask(template.name, template.estimatedPomodoros);
	}

	function deleteTemplate(templateId: string): void {
		update((state) => ({
			...state,
			templates: state.templates.filter((t) => t.id !== templateId)
		}));
	}

	return {
		subscribe,
		addTask,
		updateTask,
		deleteTask,
		toggleTaskCompletion,
		setActiveTask,
		incrementEstimate,
		decrementEstimate,
		clearFinishedTasks,
		clearAllTasks,
		incrementActualPomodoros,
		saveAsTemplate,
		createTaskFromTemplate,
		deleteTemplate,
		get activeTaskId() {
			return currentState.activeTaskId;
		}
	};
}

export const taskAgent = createTaskAgent();

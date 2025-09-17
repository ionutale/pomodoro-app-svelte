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

export interface TaskState {
	taskList: Task[];
	activeTaskId: string | null;
}

function createTaskAgent() {
	const initialState: TaskState = {
		taskList: [],
		activeTaskId: null
	};

	const { subscribe, update } = writable<TaskState>(initialState);

	let currentState = initialState;

	// Keep currentState in sync
	subscribe((state) => (currentState = state));

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

	// Premium feature - not implemented yet
	function saveAsTemplate(task: Task): void {
		// TODO: Implement template saving
		console.log('saveAsTemplate not implemented yet', task);
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
		get activeTaskId() {
			return currentState.activeTaskId;
		}
	};
}

export const taskAgent = createTaskAgent();

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { taskAgent } from '$lib/stores/task-agent';

	type Task = {
		id: string;
		name: string;
		estimatedPomodoros: number;
		actualPomodoros: number;
		isComplete: boolean;
		note?: string | null;
		dueDate?: Date | null;
	};

	type TaskTemplate = {
		id: string;
		name: string;
		estimatedPomodoros: number;
		note?: string | null;
	};

	type TaskState = { taskList: Task[]; activeTaskId: string | null; templates: TaskTemplate[] };

	let taskState: TaskState = { taskList: [], activeTaskId: null, templates: [] };
	let newTaskName = '';
	let estimatedPomodoros = 1;
	let editingTaskId: string | null = null;
	let editingNote = '';
	let editingDueDate = '';

	const unsubscribe = taskAgent.subscribe((state) => (taskState = state));
	onDestroy(() => unsubscribe());

	$: tasks = taskState.taskList;
	$: activeTaskId = taskState.activeTaskId;
	$: templates = taskState.templates;

	function addTask() {
		if (newTaskName.trim()) {
			taskAgent.addTask(newTaskName.trim(), estimatedPomodoros);
			newTaskName = '';
			estimatedPomodoros = 1;
		}
	}

	function toggleTask(taskId: string) {
		taskAgent.toggleTaskCompletion(taskId);
	}

	function setActiveTask(taskId: string) {
		taskAgent.setActiveTask(taskId);
	}

	function incrementEstimate(taskId: string) {
		taskAgent.incrementEstimate(taskId);
	}

	function decrementEstimate(taskId: string) {
		taskAgent.decrementEstimate(taskId);
	}

	function deleteTask(taskId: string) {
		taskAgent.deleteTask(taskId);
	}

	function saveAsTemplate(task: Task) {
		taskAgent.saveAsTemplate(task);
	}

	function createTaskFromTemplate(templateId: string) {
		taskAgent.createTaskFromTemplate(templateId);
	}

	function deleteTemplate(templateId: string) {
		taskAgent.deleteTemplate(templateId);
	}

	function startEditingNote(taskId: string) {
		const task = tasks.find(t => t.id === taskId);
		if (task) {
			editingTaskId = taskId;
			editingNote = task.note || '';
		}
	}

	function saveNote(taskId: string) {
		taskAgent.updateTask(taskId, { note: editingNote.trim() || null });
		editingTaskId = null;
		editingNote = '';
	}

	function cancelNoteEditing() {
		editingTaskId = null;
		editingNote = '';
	}

	function startEditingDueDate(taskId: string) {
		const task = tasks.find(t => t.id === taskId);
		if (task) {
			editingTaskId = taskId;
			editingDueDate = task.dueDate ? task.dueDate.toISOString().split('T')[0] : '';
		}
	}

	function saveDueDate(taskId: string) {
		const dueDate = editingDueDate ? new Date(editingDueDate) : null;
		taskAgent.updateTask(taskId, { dueDate });
		editingTaskId = null;
		editingDueDate = '';
	}

	function cancelDueDateEditing() {
		editingTaskId = null;
		editingDueDate = '';
	}

	function handleKeydown(event: KeyboardEvent) {
		// Handle Ctrl+I and Ctrl+D for active task
		if (event.ctrlKey && activeTaskId) {
			if (event.key === 'i' || event.key === 'I') {
				event.preventDefault();
				incrementEstimate(activeTaskId);
			} else if (event.key === 'd' || event.key === 'D') {
				event.preventDefault();
				decrementEstimate(activeTaskId);
			}
		}
	}

	// Add keyboard event listener
	onMount(() => {
		document.addEventListener('keydown', handleKeydown);
		return () => document.removeEventListener('keydown', handleKeydown);
	});

	function handleTaskKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			addTask();
		}
	}
</script>

<div class="task-list-container">
	<div class="add-task">
		<input
			type="text"
			placeholder="What are you working on?"
			bind:value={newTaskName}
			on:keydown={handleTaskKeydown}
		/>
		<input type="number" min="1" max="10" bind:value={estimatedPomodoros} style="width: 60px;" />
		<button on:click={addTask} disabled={!newTaskName.trim()}> Add Task </button>
	</div>

	<div class="task-list">
		{#each tasks as task (task.id)}
			<div
				class="task-item"
				class:completed={task.isComplete}
				class:active={task.id === activeTaskId}
			>
				<div class="task-content">
					<input type="checkbox" checked={task.isComplete} on:change={() => toggleTask(task.id)} />
					<div class="task-details">
						<span class="task-name" class:completed-text={task.isComplete}>
							{task.name}
						</span>
						{#if task.note}
							<div class="task-note">
								📝 {task.note}
							</div>
						{/if}
						{#if task.dueDate}
							<div class="task-due-date" class:overdue={task.dueDate < new Date() && !task.isComplete}>
								📅 {task.dueDate.toLocaleDateString()}
							</div>
						{/if}
					</div>
				</div>

				<div class="task-controls">
					<div class="estimate-controls">
						<button
							class="estimate-btn"
							on:click={() => decrementEstimate(task.id)}
							disabled={task.estimatedPomodoros <= 1}
						>
							-
						</button>
						<span class="estimate">
							{task.actualPomodoros}/{task.estimatedPomodoros}
						</span>
						<button class="estimate-btn" on:click={() => incrementEstimate(task.id)}> + </button>
					</div>

					<button
						class="set-active-btn"
						on:click={() => setActiveTask(task.id)}
						disabled={task.isComplete}
					>
						{task.id === activeTaskId ? 'Active' : 'Set Active'}
					</button>

					<button class="edit-btn" on:click={() => startEditingNote(task.id)} title="Edit Note">
						📝
					</button>

					<button class="calendar-btn" on:click={() => startEditingDueDate(task.id)} title="Set Due Date">
						📅
					</button>

					<button class="template-btn" on:click={() => saveAsTemplate(task)} title="Save as Template">
						★
					</button>

					<button class="delete-btn" on:click={() => deleteTask(task.id)}> × </button>
				</div>
			</div>

			{#if editingTaskId === task.id}
				<div class="edit-modal">
					<div class="edit-modal-content">
						<h4>Edit Task Details</h4>

						<div class="edit-field">
							<label for="note-textarea">Note:</label>
							<textarea
								id="note-textarea"
								bind:value={editingNote}
								placeholder="Add a note..."
								rows="3"
							></textarea>
						</div>

						<div class="edit-field">
							<label for="due-date-input">Due Date:</label>
							<input
								id="due-date-input"
								type="date"
								bind:value={editingDueDate}
								min={new Date().toISOString().split('T')[0]}
							/>
						</div>

						<div class="edit-actions">
							<button on:click={() => saveNote(task.id)}>Save Note</button>
							<button on:click={() => saveDueDate(task.id)}>Save Date</button>
							<button on:click={cancelNoteEditing}>Cancel</button>
						</div>
					</div>
				</div>
			{/if}
		{/each}
	</div>

	{#if tasks.length > 0}
		<div class="task-actions">
			<button on:click={() => taskAgent.clearFinishedTasks()}> Clear Finished </button>
			<button on:click={() => taskAgent.clearAllTasks()}> Clear All </button>
		</div>
	{/if}

	{#if templates.length > 0}
		<div class="templates-section">
			<h3>Task Templates</h3>
			<div class="templates-list">
				{#each templates as template (template.id)}
					<div class="template-item">
						<div class="template-info">
							<span class="template-name">{template.name}</span>
							<span class="template-estimate">({template.estimatedPomodoros} pomodoros)</span>
						</div>
						<div class="template-controls">
							<button class="use-template-btn" on:click={() => createTaskFromTemplate(template.id)}>
								Use Template
							</button>
							<button class="delete-template-btn" on:click={() => deleteTemplate(template.id)}>
								×
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.task-list-container {
		max-width: 600px;
		margin: 0 auto;
		padding: 1rem;
	}

	.add-task {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1rem;
	}

	.add-task input[type='text'] {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
	}

	.add-task input[type='number'] {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
	}

	.add-task button {
		padding: 0.5rem 1rem;
		background-color: #3498db;
		color: white;
		border: none;
		border-radius: 0.5rem;
		cursor: pointer;
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
		transition:
			transform 0.12s ease,
			background-color 0.2s ease;
	}
	.add-task button:hover:not(:disabled) {
		background-color: #2980b9;
		transform: translateY(-1px);
	}

	.add-task button:disabled {
		background-color: #bdc3c7;
		cursor: not-allowed;
	}

	.task-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.task-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
		transition: all 0.2s ease;
	}

	.task-item.completed {
		background-color: #f8f9fa;
		opacity: 0.7;
	}

	.task-item.active {
		border-color: #27ae60;
		background-color: #d5f4e6;
	}

	.task-content {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
	}

	.task-details {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.task-name {
		flex: 1;
		font-weight: 500;
	}

	.task-name.completed-text {
		text-decoration: line-through;
		color: #666;
	}

	.task-note {
		font-size: 0.85rem;
		color: #666;
		font-style: italic;
		margin-left: 0.5rem;
	}

	.task-due-date {
		font-size: 0.85rem;
		color: #27ae60;
		margin-left: 0.5rem;
	}

	.task-due-date.overdue {
		color: #e74c3c;
		font-weight: 500;
	}

	.task-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.estimate-controls {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.estimate-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #ddd;
		background-color: white;
		cursor: pointer;
		border-radius: 0.25rem;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
	}

	.estimate-btn:hover:not(:disabled) {
		background-color: #f8f9fa;
	}

	.estimate-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.estimate {
		min-width: 40px;
		text-align: center;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.set-active-btn {
		padding: 0.25rem 0.5rem;
		border: 1px solid #27ae60;
		background-color: white;
		color: #27ae60;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.set-active-btn:hover:not(:disabled) {
		background-color: #27ae60;
		color: white;
	}

	.set-active-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		background-color: #bdc3c7;
		border-color: #bdc3c7;
		color: white;
	}

	.delete-btn {
		width: 24px;
		height: 24px;
		border: none;
		background-color: #e74c3c;
		color: white;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
	}

	.delete-btn:hover {
		background-color: #c0392b;
	}

	.task-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		justify-content: center;
	}

	.task-actions button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background-color: white;
		border-radius: 0.25rem;
		cursor: pointer;
	}

	.task-actions button:hover {
		background-color: #f8f9fa;
	}

	.templates-section {
		margin-top: 2rem;
		padding: 1rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: #f9f9f9;
	}

	.templates-section h3 {
		margin: 0 0 1rem 0;
		font-size: 1.1rem;
		color: #333;
	}

	.templates-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.template-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem;
		border: 1px solid #ddd;
		border-radius: 0.5rem;
		background-color: white;
	}

	.template-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.template-name {
		font-weight: 500;
	}

	.template-estimate {
		font-size: 0.8rem;
		color: #666;
	}

	.template-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.use-template-btn {
		padding: 0.25rem 0.75rem;
		border: 1px solid #3498db;
		background-color: white;
		color: #3498db;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.8rem;
	}

	.use-template-btn:hover {
		background-color: #3498db;
		color: white;
	}

	.delete-template-btn {
		width: 24px;
		height: 24px;
		border: none;
		background-color: #e74c3c;
		color: white;
		border-radius: 50%;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1rem;
	}

	.delete-template-btn:hover {
		background-color: #c0392b;
	}

	.template-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #f39c12;
		background-color: white;
		color: #f39c12;
		border-radius: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.9rem;
	}

	.edit-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #3498db;
		background-color: white;
		color: #3498db;
		border-radius: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
	}

	.edit-btn:hover {
		background-color: #3498db;
		color: white;
	}

	.calendar-btn {
		width: 24px;
		height: 24px;
		border: 1px solid #9b59b6;
		background-color: white;
		color: #9b59b6;
		border-radius: 0.25rem;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8rem;
	}

	.calendar-btn:hover {
		background-color: #9b59b6;
		color: white;
	}

	.edit-modal {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.edit-modal-content {
		background-color: white;
		padding: 1.5rem;
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		max-width: 400px;
		width: 90%;
	}

	.edit-modal-content h4 {
		margin: 0 0 1rem 0;
		color: #333;
	}

	.edit-field {
		margin-bottom: 1rem;
	}

	.edit-field label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: #555;
	}

	.edit-field textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
		font-family: inherit;
		resize: vertical;
	}

	.edit-field input[type="date"] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 0.25rem;
	}

	.edit-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}

	.edit-actions button {
		padding: 0.5rem 1rem;
		border: 1px solid #ddd;
		background-color: white;
		border-radius: 0.25rem;
		cursor: pointer;
		font-size: 0.9rem;
	}

	.edit-actions button:first-child,
	.edit-actions button:nth-child(2) {
		background-color: #3498db;
		color: white;
		border-color: #3498db;
	}

	.edit-actions button:first-child:hover,
	.edit-actions button:nth-child(2):hover {
		background-color: #2980b9;
	}

	.edit-actions button:last-child:hover {
		background-color: #f8f9fa;
	}
</style>

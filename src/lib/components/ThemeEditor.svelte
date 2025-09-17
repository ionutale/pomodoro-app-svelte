<script lang="ts">
	import { onDestroy } from 'svelte';
	import { themeService } from '$lib/services/theme-service';
	import { settingsAgent } from '$lib/stores/settings-agent';
	import type { CustomTheme } from '$lib/services/theme-service';

	let themes: { id: string; name: string; colors: { pomodoro: string; shortBreak: string; longBreak: string }; useGradient: boolean }[] = [];
	let currentThemeId = 'default';
	let showThemeEditor = false;
	let editingTheme: CustomTheme | null = null;
	let themeName = '';
	let themeColors = {
		pomodoro: '#f67280',
		shortBreak: '#82ccdd',
		longBreak: '#78e08f'
	};
	let useGradient = true;
	let nameError = '';

	const unsubSettings = settingsAgent.subscribe(() => {
		themes = themeService.getAllThemes();
		currentThemeId = settingsAgent.getSetting('themeSettings.colorTheme') || 'default';
	});

	onDestroy(() => unsubSettings());

	function applyTheme(themeId: string) {
		themeService.applyTheme(themeId);
	}

	function startCreatingTheme() {
		editingTheme = null;
		themeName = '';
		themeColors = { pomodoro: '#f67280', shortBreak: '#82ccdd', longBreak: '#78e08f' };
		useGradient = true;
		nameError = '';
		showThemeEditor = true;
	}

	function startEditingTheme(theme: CustomTheme) {
		editingTheme = theme;
		themeName = theme.name;
		themeColors = { ...theme.colors };
		useGradient = theme.useGradient;
		nameError = '';
		showThemeEditor = true;
	}

	function cancelEditing() {
		showThemeEditor = false;
		editingTheme = null;
	}

	function validateAndSaveTheme() {
		// Validate theme name
		const validation = themeService.validateThemeName(themeName);
		if (!validation.valid) {
			nameError = validation.error || 'Invalid theme name';
			return;
		}

		if (editingTheme) {
			// Update existing theme
			themeService.updateCustomTheme(editingTheme.id, themeName, themeColors, useGradient);
		} else {
			// Create new theme
			const newThemeId = themeService.saveCustomTheme(themeName, themeColors, useGradient);
			// Apply the new theme
			themeService.applyTheme(newThemeId);
		}

		showThemeEditor = false;
		editingTheme = null;
	}

	function deleteTheme(themeId: string) {
		if (confirm('Are you sure you want to delete this theme?')) {
			themeService.deleteCustomTheme(themeId);
		}
	}

	function getThemePreviewStyle(theme: { colors: { pomodoro: string; shortBreak: string; longBreak: string }; useGradient: boolean }) {
		const bg = theme.useGradient
			? `linear-gradient(135deg, ${theme.colors.pomodoro}, ${theme.colors.shortBreak})`
			: theme.colors.pomodoro;
		return `background: ${bg};`;
	}
</script>

<div class="theme-manager">
	<div class="theme-selector">
		<label>
			<span>Current Theme</span>
			<select bind:value={currentThemeId} on:change={() => applyTheme(currentThemeId)}>
				{#each themes as theme}
					<option value={theme.id}>{theme.name}</option>
				{/each}
			</select>
		</label>

		<button class="create-theme-btn" on:click={startCreatingTheme}>
			+ Create Theme
		</button>
	</div>

	<div class="theme-grid">
		{#each themes as theme}
			<div class="theme-card" class:active={theme.id === currentThemeId}>
				<div class="theme-preview" style={getThemePreviewStyle(theme)}></div>
				<div class="theme-info">
					<h4>{theme.name}</h4>
					<div class="theme-colors">
						<div class="color-swatch" style="background-color: {theme.colors.pomodoro}" title="Pomodoro"></div>
						<div class="color-swatch" style="background-color: {theme.colors.shortBreak}" title="Short Break"></div>
						<div class="color-swatch" style="background-color: {theme.colors.longBreak}" title="Long Break"></div>
					</div>
				</div>
				<div class="theme-actions">
					{#if theme.id !== 'default'}
						<button class="edit-btn" on:click={() => startEditingTheme(theme)} title="Edit theme">✏️</button>
						<button class="delete-btn" on:click={() => deleteTheme(theme.id)} title="Delete theme">🗑️</button>
					{/if}
				</div>
			</div>
		{/each}
	</div>

	{#if showThemeEditor}
		<div class="theme-editor-modal">
			<div class="modal-content">
				<h3>{editingTheme ? 'Edit Theme' : 'Create New Theme'}</h3>

				<div class="form-group">
					<label for="theme-name">Theme Name</label>
					<input
						id="theme-name"
						type="text"
						bind:value={themeName}
						placeholder="Enter theme name"
						class:error={nameError}
					/>
					{#if nameError}
						<span class="error-message">{nameError}</span>
					{/if}
				</div>

				<div class="form-group">
					<label>Colors</label>
					<div class="color-pickers">
						<div class="color-picker">
							<label for="pomodoro-color">Pomodoro</label>
							<input id="pomodoro-color" type="color" bind:value={themeColors.pomodoro} />
						</div>
						<div class="color-picker">
							<label for="short-break-color">Short Break</label>
							<input id="short-break-color" type="color" bind:value={themeColors.shortBreak} />
						</div>
						<div class="color-picker">
							<label for="long-break-color">Long Break</label>
							<input id="long-break-color" type="color" bind:value={themeColors.longBreak} />
						</div>
					</div>
				</div>

				<div class="form-group">
					<label class="toggle">
						<input type="checkbox" bind:checked={useGradient} />
						<span>Use Gradient Background</span>
					</label>
				</div>

				<div class="theme-preview-large" style={getThemePreviewStyle({ colors: themeColors, useGradient })}>
					<div class="preview-text">Theme Preview</div>
				</div>

				<div class="modal-actions">
					<button class="cancel-btn" on:click={cancelEditing}>Cancel</button>
					<button class="save-btn" on:click={validateAndSaveTheme} disabled={!themeName.trim()}>
						{editingTheme ? 'Update Theme' : 'Create Theme'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.theme-manager {
		width: 100%;
	}

	.theme-selector {
		display: flex;
		gap: 1rem;
		align-items: end;
		margin-bottom: 1.5rem;
	}

	.theme-selector label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.9rem;
		flex: 1;
	}

	.theme-selector select {
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.create-theme-btn {
		padding: 0.5rem 1rem;
		background-color: #27ae60;
		color: white;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.create-theme-btn:hover {
		background-color: #229954;
	}

	.theme-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
		gap: 1rem;
	}

	.theme-card {
		border: 2px solid #e0e0e0;
		border-radius: 8px;
		overflow: hidden;
		transition: border-color 0.2s;
		position: relative;
	}

	.theme-card.active {
		border-color: #3498db;
		box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
	}

	.theme-preview {
		height: 80px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	.theme-info {
		padding: 0.75rem;
	}

	.theme-info h4 {
		margin: 0 0 0.5rem 0;
		font-size: 1rem;
		font-weight: 600;
	}

	.theme-colors {
		display: flex;
		gap: 0.5rem;
	}

	.color-swatch {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1px solid rgba(0, 0, 0, 0.1);
	}

	.theme-actions {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		display: flex;
		gap: 0.25rem;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.theme-card:hover .theme-actions {
		opacity: 1;
	}

	.edit-btn, .delete-btn {
		background: rgba(255, 255, 255, 0.9);
		border: none;
		border-radius: 4px;
		width: 24px;
		height: 24px;
		cursor: pointer;
		font-size: 0.8rem;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background-color 0.2s;
	}

	.edit-btn:hover {
		background-color: rgba(52, 152, 219, 0.9);
	}

	.delete-btn:hover {
		background-color: rgba(231, 76, 60, 0.9);
	}

	.theme-editor-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}

	.modal-content {
		background: white;
		border-radius: 8px;
		padding: 2rem;
		max-width: 500px;
		width: 90%;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal-content h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.25rem;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}

	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	.form-group input[type="text"] {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid #ddd;
		border-radius: 4px;
		font-size: 1rem;
	}

	.form-group input.error {
		border-color: #e74c3c;
	}

	.error-message {
		color: #e74c3c;
		font-size: 0.85rem;
		margin-top: 0.25rem;
	}

	.color-pickers {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
	}

	.color-picker {
		text-align: center;
	}

	.color-picker label {
		display: block;
		margin-bottom: 0.5rem;
		font-size: 0.9rem;
	}

	.color-picker input[type="color"] {
		width: 60px;
		height: 40px;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	.toggle {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: normal;
	}

	.theme-preview-large {
		height: 100px;
		border-radius: 4px;
		margin: 1rem 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		font-weight: 600;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
	}

	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}

	.cancel-btn, .save-btn {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.9rem;
		transition: background-color 0.2s;
	}

	.cancel-btn {
		background-color: #95a5a6;
		color: white;
	}

	.cancel-btn:hover {
		background-color: #7f8c8d;
	}

	.save-btn {
		background-color: #27ae60;
		color: white;
	}

	.save-btn:hover:not(:disabled) {
		background-color: #229954;
	}

	.save-btn:disabled {
		background-color: #bdc3c7;
		cursor: not-allowed;
	}

	@media (max-width: 768px) {
		.theme-selector {
			flex-direction: column;
			align-items: stretch;
		}

		.theme-grid {
			grid-template-columns: 1fr;
		}

		.color-pickers {
			grid-template-columns: 1fr;
		}

		.modal-content {
			padding: 1rem;
		}
	}
</style>
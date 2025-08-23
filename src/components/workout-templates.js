/**
 * @file workout-templates.js
 * This component allows users to create, save, and manage workout templates.
 * It's a key part of the new workflow that enables quick workout starts.
 */

import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import { exerciseDatabase } from "../services/exercise-database.js";

class WorkoutTemplates extends LitElement {
  static properties = {
    templates: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    showNewTemplateForm: { type: Boolean },
    newTemplateName: { type: String },
    newTemplateExercises: { type: Array },
    isSaving: { type: Boolean },
    selectedFocus: { type: String },
    selectedFrequency: { type: String },
  };

  constructor() {
    super();
    this.templates = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.showNewTemplateForm = false;
    this.newTemplateName = "";
    this.newTemplateExercises = [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }];
    this.isSaving = false;
    this.selectedFocus = "all";
    this.selectedFrequency = "all";
    this.broadMuscleGroups = {
        'Upper Body': ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms'],
        'Lower Body': ['quads', 'hamstrings', 'glutes', 'calves'],
        'Full Body': Object.keys(exerciseDatabase)
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchTemplates();
  }

  async _fetchTemplates() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      this.templates = data?.templates || [];
    } catch (error) {
      this.errorMessage = "Failed to load templates.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  _addExerciseToTemplate() {
    this.newTemplateExercises = [...this.newTemplateExercises, { muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }];
  }

  _handleExerciseInput(index, field, value) {
    const updatedExercises = [...this.newTemplateExercises];
    updatedExercises[index][field] = value;
    this.newTemplateExercises = updatedExercises;
  }
  
  _handleMuscleGroupChange(index, value) {
    const updatedExercises = [...this.newTemplateExercises];
    updatedExercises[index].muscleGroup = value;
    updatedExercises[index].name = ""; // Reset exercise name when muscle group changes
    this.newTemplateExercises = updatedExercises;
  }

  _removeExercise(index) {
    const updatedExercises = this.newTemplateExercises.filter((_, i) => i !== index);
    this.newTemplateExercises = updatedExercises;
  }
  
  async _saveTemplate() {
    this.isSaving = true;
    try {
        const newTemplate = {
            name: this.newTemplateName,
            exercises: this.newTemplateExercises.map(ex => ({
                name: ex.name,
                sets: Array(Number(ex.sets) || 3).fill({}),
                targetReps: Number(ex.reps) || 10,
                targetRir: Number(ex.rir) || 2,
            }))
        };
        const updatedTemplates = [...this.templates, newTemplate];
        const response = saveDataLocally({ templates: updatedTemplates });

        if (response.success) {
            this.templates = updatedTemplates;
            this.showNewTemplateForm = false;
            this.newTemplateName = "";
            this.newTemplateExercises = [];
            this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: 'Template saved successfully!', type: 'success' }, bubbles: true, composed: true }));
        } else {
            throw new Error(response.error);
        }
    } catch (error) {
        this.dispatchEvent(new CustomEvent('show-toast', { detail: { message: `Failed to save template: ${error.message}`, type: 'error' }, bubbles: true, composed: true }));
    } finally {
        this.isSaving = false;
    }
  }
  
  _loadTemplate(template) {
    this.dispatchEvent(new CustomEvent('start-workout-with-template', { 
      detail: { template: template },
      bubbles: true, 
      composed: true 
    }));
  }

  _handleFocusChange(e) {
    this.selectedFocus = e.target.value;
  }

  _handleFrequencyChange(e) {
    this.selectedFrequency = e.target.value;
  }

  _getFilteredTemplates() {
    return this.templates.filter(template => {
      const focusMatch = this.selectedFocus === 'all' || template.primaryFocus === this.selectedFocus;
      const frequencyMatch = this.selectedFrequency === 'all' || template.daysPerWeek == this.selectedFrequency;
      return focusMatch && frequencyMatch;
    });
  }

  render() {
    if (this.isLoading) {
      return html`
        <div class="container">
            <header class="app-header">
                <button class="btn btn-icon" @click=${() => this.dispatchEvent(new CustomEvent('setView', { detail: { view: 'home' }, bubbles: true, composed: true }))} aria-label="Back">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
                </button>
                <h1>Templates</h1>
                <div style="width: 48px;"></div>
            </header>
            <p>Loading templates...</p>
        </div>
      `;
    }
    if (this.errorMessage) {
      return html`<p class="error-message">${this.errorMessage}</p>`;
    }

    return html`
      <div class="container">
        <header class="app-header">
          <button class="btn btn-icon" @click=${() => this.dispatchEvent(new CustomEvent('setView', { detail: { view: 'home' }, bubbles: true, composed: true }))} aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <h1>Templates</h1>
          <div style="width: 48px;"></div>
        </header>
        ${this.showNewTemplateForm ? this._renderNewTemplateForm() : this._renderTemplateList()}
      </div>
    `;
  }

  _renderTemplateList() {
    const filteredTemplates = this._getFilteredTemplates();
    const focusOptions = [...new Set(this.templates.map(t => t.primaryFocus))];
    const frequencyOptions = [...new Set(this.templates.map(t => t.daysPerWeek))].sort((a,b) => a-b);

    return html`
      <button class="cta-button" @click=${() => this.showNewTemplateForm = true}>
        Create New Template
      </button>

      <div class="filter-controls card">
          <div class="input-group">
            <label for="focus-select">Primary Focus:</label>
            <select id="focus-select" @change=${this._handleFocusChange}>
              <option value="all">All</option>
              ${focusOptions.map(focus => html`<option value="${focus}">${focus}</option>`)}
            </select>
          </div>
          <div class="input-group">
            <label for="frequency-select">Workout Frequency (days/week):</label>
            <select id="frequency-select" @change=${this._handleFrequencyChange}>
              <option value="all">All</option>
               ${frequencyOptions.map(days => html`<option value="${days}">${days}</option>`)}
            </select>
          </div>
        </div>

      <div class="templates-list">
        ${filteredTemplates.length === 0 ? html`<p class="no-data">No templates match your criteria.</p>` : ''}
        ${filteredTemplates.map(template => html`
          <div class="card link-card template-card">
            <div class="template-info" @click=${() => this._loadTemplate(template)}>
              <h3>${template.name}</h3>
              <p>${template.exercises.length} exercises</p>
            </div>
            <button class="btn-icon" @click=${() => this._loadTemplate(template)} aria-label="Load template">
              ▶️
            </button>
          </div>
        `)}
      </div>
    `;
  }
  
  _getExercisesForGroup(groupName) {
    if (this.broadMuscleGroups[groupName]) {
      // It's a broad category
      return this.broadMuscleGroups[groupName].flatMap(muscle => exerciseDatabase[muscle] || []);
    } else if (exerciseDatabase[groupName]) {
      // It's a specific muscle
      return exerciseDatabase[groupName];
    }
    return [];
  }

  _renderNewTemplateForm() {
    const muscleGroups = [
        ...Object.keys(this.broadMuscleGroups), 
        ...Object.keys(exerciseDatabase)
    ];

    return html`
      <div class="new-template-form card">
        <h3>Create New Template</h3>
        <div class="input-group">
          <label for="template-name">Template Name:</label>
          <input
            id="template-name"
            type="text"
            .value=${this.newTemplateName}
            @input=${(e) => this.newTemplateName = e.target.value}
            placeholder="e.g., Full Body A"
          />
        </div>
        
        <div class="exercise-list">
          ${this.newTemplateExercises.map((exercise, index) => {
            const availableExercises = this._getExercisesForGroup(exercise.muscleGroup);
            return html`
            <div class="exercise-editor card">
              <div class="exercise-editor-header">
                <div class="exercise-selectors">
                  <select class="muscle-group-select" @change=${(e) => this._handleMuscleGroupChange(index, e.target.value)}>
                    <option value="">Select Muscle Group</option>
                    ${muscleGroups.map(muscle => html`<option value="${muscle}">${muscle.charAt(0).toUpperCase() + muscle.slice(1)}</option>`)}
                  </select>

                  ${exercise.muscleGroup ? html`
                    <select class="exercise-select" .value=${exercise.name} @change=${(e) => this._handleExerciseInput(index, 'name', e.target.value)}>
                      <option value="">Select Exercise</option>
                      ${availableExercises.map(ex => html`<option value="${ex.name}">${ex.name}</option>`)}
                    </select>
                  ` : ''}
                </div>
                <button class="btn-icon" @click=${() => this._removeExercise(index)}>
                  ✖️
                </button>
              </div>
              <div class="exercise-details">
                <label>Sets: <input type="number" .value=${exercise.sets} @input=${(e) => this._handleExerciseInput(index, 'sets', e.target.value)}></label>
                <label>Reps: <input type="number" .value=${exercise.reps} @input=${(e) => this._handleExerciseInput(index, 'reps', e.target.value)}></label>
                <label>RIR: <input type="number" .value=${exercise.rir} @input=${(e) => this._handleExerciseInput(index, 'rir', e.target.value)}></label>
              </div>
            </div>
          `})}
        </div>
        
        <div class="form-actions">
          <button class="secondary-button" @click=${this._addExerciseToTemplate}>
            Add Exercise
          </button>
          <button class="cta-button" @click=${this._saveTemplate} ?disabled=${!this.newTemplateName || this.newTemplateExercises.length === 0 || this.isSaving}>
            ${this.isSaving ? html`<div class="spinner"></div>` : 'Save Template'}
          </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
      return this;
  }
}

customElements.define("workout-templates", WorkoutTemplates);

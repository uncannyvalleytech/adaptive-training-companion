/**
 * @file workout-templates.js
 * This component allows users to create, save, and manage workout templates.
 * It's a key part of the new workflow that enables quick workout starts.
 */

import { LitElement, html } from "lit";
import { saveData, getData } from "../services/api.js";
import { getCredential } from "../services/google-auth.js";

class WorkoutTemplates extends LitElement {
  static properties = {
    templates: { type: Array },
    isLoading: { type: Boolean },
    errorMessage: { type: String },
    showNewTemplateForm: { type: Boolean },
    newTemplateName: { type: String },
    newTemplateExercises: { type: Array },
    isSaving: { type: Boolean },
  };

  constructor() {
    super();
    this.templates = [];
    this.isLoading = true;
    this.errorMessage = "";
    this.showNewTemplateForm = false;
    this.newTemplateName = "";
    this.newTemplateExercises = [];
    this.isSaving = false;
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchTemplates();
  }

  async _fetchTemplates() {
    this.isLoading = true;
    try {
      const token = getCredential().credential;
      if (!token) {
        throw new Error("User not authenticated.");
      }
      const response = await getData(token);
      if (response && response.data && response.data.templates) {
        this.templates = response.data.templates;
      } else {
        this.templates = [];
      }
    } catch (error) {
      this.errorMessage = "Failed to load templates.";
      console.error(error);
    } finally {
      this.isLoading = false;
    }
  }

  _addExerciseToTemplate() {
    this.newTemplateExercises = [...this.newTemplateExercises, { name: "", sets: 3, reps: 10, rpe: 7 }];
  }

  // Correctly handle input for each exercise field
  _handleExerciseInput(index, field, value) {
    const updatedExercises = [...this.newTemplateExercises];
    updatedExercises[index][field] = value;
    this.newTemplateExercises = updatedExercises;
  }

  _removeExercise(index) {
    const updatedExercises = this.newTemplateExercises.filter((_, i) => i !== index);
    this.newTemplateExercises = updatedExercises;
  }
  
  async _saveTemplate() {
    this.isSaving = true;
    try {
        const token = getCredential().credential;
        const newTemplate = {
            name: this.newTemplateName,
            // Ensure sets, reps, and RPE are parsed as numbers and have fallbacks
            exercises: this.newTemplateExercises.map(ex => ({
                name: ex.name,
                sets: Array(Number(ex.sets) || 3).fill({}),
                targetReps: Number(ex.reps) || 10,
                targetRpe: Number(ex.rpe) || 7,
            }))
        };
        const updatedTemplates = [...this.templates, newTemplate];
        const response = await saveData({ templates: updatedTemplates }, token);

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

  render() {
    if (this.isLoading) {
      return html`<p>Loading templates...</p>`;
    }
    if (this.errorMessage) {
      return html`<p class="error-message">${this.errorMessage}</p>`;
    }

    return html`
      <div class="container">
        <header class="app-header">
          <h1>Workout Templates</h1>
        </header>
        ${this.showNewTemplateForm ? this._renderNewTemplateForm() : this._renderTemplateList()}
      </div>
    `;
  }

  _renderTemplateList() {
    return html`
      <button class="cta-button" @click=${() => this.showNewTemplateForm = true}>
        Create New Template
      </button>
      <div class="templates-list">
        ${this.templates.length === 0 ? html`<p class="no-data">No templates saved yet. Create your first one!</p>` : ''}
        ${this.templates.map(template => html`
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
  
  _renderNewTemplateForm() {
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
          ${this.newTemplateExercises.map((exercise, index) => html`
            <div class="exercise-editor card">
              <div class="exercise-editor-header">
                <input
                  type="text"
                  .value=${exercise.name}
                  @input=${(e) => this._handleExerciseInput(index, 'name', e.target.value)}
                  placeholder="Exercise Name"
                />
                <button class="btn-icon" @click=${() => this._removeExercise(index)}>
                  ✖️
                </button>
              </div>
              <div class="exercise-details">
                <label>Sets: <input type="number" .value=${exercise.sets} @input=${(e) => this._handleExerciseInput(index, 'sets', e.target.value)}></label>
                <label>Reps: <input type="number" .value=${exercise.reps} @input=${(e) => this._handleExerciseInput(index, 'reps', e.target.value)}></label>
                <label>RPE: <input type="number" .value=${exercise.rpe} @input=${(e) => this._handleExerciseInput(index, 'rpe', e.target.value)}></label>
              </div>
            </div>
          `)}
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

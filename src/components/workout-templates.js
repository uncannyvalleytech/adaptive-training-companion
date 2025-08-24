/**
 * @file workout-templates.js
 * This component allows users to create, save, and manage workout templates.
 * It's a key part of the new workflow that enables quick workout starts.
 */

import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";

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
    selectedEquipment: { type: Array },
    selectedGenderFocus: { type: String },
    currentRoutineView: { type: String }, // 'menu', 'premade', 'create'
    selectedMesocycle: { type: Object }, // The selected mesocycle to view its phases
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
    this.selectedEquipment = [];
    this.selectedGenderFocus = "all";
    this.currentRoutineView = "menu";
    this.selectedMesocycle = null;

    this.exerciseDatabase = {
        'chest': [
            { name: 'Barbell Bench Press' },
            { name: 'Dumbbell Bench Press' },
            { name: 'Incline Dumbbell Press' },
            { name: 'Machine Chest Press' },
            { name: 'Cable Crossover' },
            { name: 'Push-ups' },
            { name: 'Incline Barbell Press' },
            { name: 'Decline Bench Press' },
            { name: 'Chest Dip' },
            { name: 'Larsen Press' },
            { name: 'Standing Dumbbell Arnold Press' },
            { name: 'Press-Around' },
            { name: 'Low Incline DB Press' },
            { name: 'Machine Shoulder Press' },
            { name: 'Cable Crossover Ladder' },
            { name: 'High-Incline Smith Machine Press' },
            { name: 'Incline Push-ups' },
            { name: 'Seated Cable Fly' },
            { name: 'Standing Cable Fly' },
            { name: 'Dumbbell Flyes' }
        ],
        'back': [
            { name: 'Barbell Deadlift' },
            { name: 'Pull-Up' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Seated Cable Row' },
            { name: 'Face Pulls' },
            { name: 'T-Bar Row' },
            { name: 'Dumbbell Row' },
            { name: 'Kroc Row' },
            { name: 'Cable Shrug' },
            { name: 'Reverse Pec Deck' },
            { name: 'Neutral-Grip Lat Pulldown' },
            { name: 'Close-Grip Seated Cable Row' },
            { name: 'Machine Shrug' },
            { name: 'Pendlay Row' },
            { name: 'Machine Pulldown' },
            { name: 'Rope Facepull' },
            { name: 'Weighted Pull-Up' },
            { name: 'Bent-Over Barbell Row' },
            { name: 'Chest-Supported T-Bar Row' },
            { name: 'Cable Pullover' },
            { name: 'Weighted Chin-Up' },
            { name: 'Meadows Row' },
            { name: 'Machine Reverse Fly' }
        ],
        'shoulders': [
            { name: 'Overhead Press' },
            { name: 'Dumbbell Shoulder Press' },
            { name: 'Lateral Raises' },
            { name: 'Front Raises' },
            { name: 'Face Pulls' },
            { name: 'Egyptian Cable Lateral Raise' },
            { name: 'Lean-In Constant Tension DB Lateral Raise' },
            { name: 'Cable Lateral Raise' },
            { name: 'Seated Dumbbell Press' },
            { name: 'One-Arm Cable Lateral Raise' },
            { name: 'Barbell Front Raise' },
            { name: 'Dumbbell Shrugs' },
            { name: 'Seated Dumbbell Shoulder Press' },
            { name: 'Seated Barbell Press' },
            { name: 'Seated Arnold Press' },
            { name: 'Dumbbell Lateral Raise' },
            { name: 'Upright Row' },
            { name: 'Barbell Shrug' }
        ],
        'biceps': [
            { name: 'Barbell Curl' },
            { name: 'Dumbbell Hammer Curl' },
            { name: 'Preacher Curl' },
            { name: 'Incline Dumbbell Curl' },
            { name: 'N1-Style Cross-Body Cable Bicep Curl' },
            { name: 'Alternating DB Curl' },
            { name: '1-Arm DB Preacher Curl' },
            { name: 'Bayesian Cable Curl' },
            { name: 'Dumbbell Bicep Curls' },
            { name: 'Cable Bicep Curl' },
            { name: 'Concentration Curl' },
            { name: 'EZ Bar Preacher Curl' },
            { name: 'Hammer Curl' },
            { name: 'Incline Dumbbell Curl & Incline Skullcrusher' },
            { name: 'Cable Curl & Cable Pressdown' }
        ],
        'triceps': [
            { name: 'Tricep Pushdown' },
            { name: 'Skull Crushers' },
            { name: 'Overhead Tricep Extension' },
            { name: 'Close Grip Bench Press' },
            { name: 'Overhead Cable Triceps Extension' },
            { name: 'Cable Triceps Kickback' },
            { name: 'Triceps Rope Pushdown' },
            { name: 'Triceps Pushdown' },
            { name: 'Dumbbell Skullcrushers' },
            { name: 'EZ Bar Skullcrusher' },
            { name: 'Cable Tricep Extension' },
            { name: 'Tricep Overhead Extension' },
            { name: 'Tricep Kickback' },
            { name: 'Close-Grip Barbell Bench Press' }
        ],
        'quads': [
            { name: 'Barbell Squat' },
            { name: 'Leg Press' },
            { name: 'Leg Extensions' },
            { name: 'Hack Squat' },
            { name: 'Pause Squat (Back off)' },
            { name: 'Front Squats' },
            { name: 'Goblet Squat' },
            { name: 'Smith Machine Squat' },
            { name: 'Leg Extension' },
            { name: 'Squats' }
        ],
        'hamstrings': [
            { name: 'Romanian Deadlift' },
            { name: 'Hamstring Curls' },
            { name: 'Good Mornings' },
            { name: 'Barbell RDL' },
            { name: 'Seated Leg Curl' },
            { name: 'Lying Leg Curl' },
            { name: 'Stiff-Leg Deadlift' },
            { name: 'Leg Curl' },
            { name: 'Lying Leg Curl' },
            { name: 'Dumbbell Romanian Deadlift' }
        ],
        'glutes': [
            { name: 'Hip Thrust' },
            { name: 'Glute Kickback' },
            { name: 'Bulgarian Split Squat' },
            { name: 'Walking Lunge' },
            { name: 'Glute Medius Kickback' },
            { name: 'Cable Pull Through' },
            { name: 'Barbell Hip Thrust' },
            { name: 'Dumbbell Walking Lunge' },
            { name: 'Reverse Lunges' },
            { name: 'Glute Cable Kickback' },
            { name: 'Smith Machine Sumo Squats' },
            { name: 'Hyperextensions (Glute Focused)' },
            { name: 'Abduction Machine' },
            { name: 'Glute Bridge' }
        ],
        'calves': [
            { name: 'Calf Raises' },
            { name: 'Seated Calf Raises' },
            { name: 'Standing Calf Raise' },
            { name: 'Seated Calf Raise' }
        ],
        'arms': [
            { name: 'Barbell Curl' },
            { name: 'Tricep Pushdown' },
            { name: 'Hammer Curl' },
            { name: 'Close Grip Bench Press' },
            { name: 'Preacher Curl' },
            { name: 'Overhead Tricep Extension' },
            { name: 'Diamond Pushup' }
        ],
        'legs': [
            { name: 'Barbell Squat' },
            { name: 'Romanian Deadlift' },
            { name: 'Leg Press' },
            { name: 'Leg Extensions' },
            { name: 'Hamstring Curls' },
            { name: 'Walking Lunge' },
            { name: 'Bulgarian Split Squat' },
            { name: 'Hip Thrust' },
            { name: 'Calf Raises' },
            { name: 'Barbell Back Squat' },
            { name: 'Conventional Deadlift' }
        ],
        'upper body': [
            { name: 'Bench Press' },
            { name: 'Pull-ups' },
            { name: 'Overhead Press' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Dumbbell Shoulder Press' },
            { name: 'Incline Dumbbell Press' }
        ],
        'lower body': [
            { name: 'Squat' },
            { name: 'Deadlift' },
            { name: 'Romanian Deadlift' },
            { name: 'Leg Press' },
            { name: 'Walking Lunge' },
            { name: 'Hip Thrust' },
            { name: 'Leg Extensions' },
            { name: 'Hamstring Curls' }
        ],
        'full body': [
            { name: 'Deadlift' },
            { name: 'Squat' },
            { name: 'Bench Press' },
            { name: 'Pull-ups' },
            { name: 'Overhead Press' },
            { name: 'Barbell Row' },
            { name: 'Push-ups' },
            { name: 'Burpee' }
        ],
        'push': [
            { name: 'Bench Press' },
            { name: 'Overhead Press' },
            { name: 'Incline Dumbbell Press' },
            { name: 'Lateral Raises' },
            { name: 'Tricep Pushdown' },
            { name: 'Close Grip Bench Press' },
            { name: 'Dumbbell Shoulder Press' }
        ],
        'pull': [
            { name: 'Pull-ups' },
            { name: 'Barbell Row' },
            { name: 'Lat Pulldown' },
            { name: 'Seated Cable Row' },
            { name: 'Face Pulls' },
            { name: 'Barbell Curl' },
            { name: 'Hammer Curl' }
        ],
        'neck & traps': [
            { name: '45-Degree Neck Extension' },
            { name: 'Side Neck Raise' },
            { name: 'Dumbbell Shrug' },
            { name: 'Neck Flexion (with plate)' },
            { name: 'Head Harness Neck Extension' },
            { name: 'Machine Shrug' }
        ]
    };
    
    this.premadeMesocycles = [];
  }

  connectedCallback() {
    super.connectedCallback();
    this._fetchTemplates();
  }

  async _fetchTemplates() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      this.templates = [...(data?.templates || [])];
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
    updatedExercises[index].name = "";
    this.newTemplateExercises = updatedExercises;
  }

  _removeExercise(index) {
    const updatedExercises = this.newTemplateExercises.filter((_, i) => i !== index);
    this.newTemplateExercises = updatedExercises;
  }
  
  async _saveTemplate() {
    this.isSaving = true;
    try {
        if (!this.newTemplateName.trim()) {
            throw new Error("Please enter a template name");
        }
        
        const validExercises = this.newTemplateExercises.filter(ex => ex.name && ex.muscleGroup);
        if (validExercises.length === 0) {
            throw new Error("Please add at least one exercise");
        }

        const newTemplate = {
            id: Date.now().toString(),
            name: this.newTemplateName.trim(),
            primaryFocus: "custom",
            daysPerWeek: 0,
            genderFocus: "all",
            equipment: [],
            exercises: validExercises.map(ex => ({
                name: ex.name,
                sets: Array(Number(ex.sets) || 3).fill({}),
                targetReps: `${Number(ex.reps) || 10}`,
                targetRir: Number(ex.rir) || 2,
                muscleGroup: ex.muscleGroup
            }))
        };
        
        const existingData = getDataLocally();
        const existingTemplates = existingData?.templates || [];
        const customTemplates = existingTemplates.filter(t => t.primaryFocus === "custom");
        const otherTemplates = existingTemplates.filter(t => t.primaryFocus !== "custom");
        const updatedTemplates = [...otherTemplates, ...customTemplates, newTemplate];
        
        const response = saveDataLocally({ templates: updatedTemplates });

        if (response.success) {
            this.templates = updatedTemplates;
            this.currentRoutineView = "menu";
            this.newTemplateName = "";
            this.newTemplateExercises = [{ muscleGroup: '', name: "", sets: 3, reps: 10, rir: 2 }];
            this.dispatchEvent(new CustomEvent('show-toast', { 
                detail: { message: 'Template saved successfully!', type: 'success' }, 
                bubbles: true, 
                composed: true 
            }));
        } else {
            throw new Error(response.error || "Failed to save template");
        }
    } catch (error) {
        console.error("Save template error:", error);
        this.dispatchEvent(new CustomEvent('show-toast', { 
            detail: { message: error.message, type: 'error' }, 
            bubbles: true, 
            composed: true 
        }));
    } finally {
        this.isSaving = false;
    }
  }
  
  _loadTemplate(template) {
    // Ensure template has proper structure for workout session
    const workoutTemplate = {
        name: template.name,
        exercises: (template.exercises || []).map(exercise => ({
            name: exercise.name,
            sets: exercise.sets || Array(3).fill({}),
            targetReps: exercise.targetReps || "8-12",
            targetRir: exercise.targetRir || 2,
            muscleGroup: exercise.muscleGroup || this._inferMuscleGroup(exercise.name)
        }))
    };

    this.dispatchEvent(new CustomEvent('start-workout-with-template', { 
      detail: { template: workoutTemplate },
      bubbles: true, 
      composed: true 
    }));
  }

  _inferMuscleGroup(exerciseName) {
    const name = exerciseName.toLowerCase();
    for (const [muscleGroup, exercises] of Object.entries(this.exerciseDatabase)) {
      if (exercises.some(ex => ex.name.toLowerCase() === name)) {
        return muscleGroup;
      }
    }
    return 'general';
  }

  _handleFilterChange(e) {
    const { name, value } = e.target;
    if (name === "equipment") {
      const isChecked = e.target.checked;
      if (isChecked) {
        this.selectedEquipment = [...this.selectedEquipment, value];
      } else {
        this.selectedEquipment = this.selectedEquipment.filter(item => item !== value);
      }
    } else {
      this[`selected${name.charAt(0).toUpperCase() + name.slice(1)}`] = value;
    }
    this.requestUpdate();
  }
  
  _getFilteredMesocycles() {
    return this.premadeMesocycles.filter(meso => {
      const focusMatch = this.selectedFocus === 'all' || meso.primaryFocus.includes(this.selectedFocus);
      const frequencyMatch = this.selectedFrequency === 'all' || meso.daysPerWeek == this.selectedFrequency;
      const genderMatch = this.selectedGenderFocus === 'all' || meso.genderFocus === this.selectedGenderFocus;
      const equipmentMatch = this.selectedEquipment.length === 0 || this.selectedEquipment.every(eq => meso.equipment.includes(eq));
      return focusMatch && frequencyMatch && genderMatch && equipmentMatch;
    });
  }

  render() {
    if (this.isLoading) {
      return html`<p>Loading templates...</p>`;
    }
    if (this.errorMessage) {
      return html`<p class="error-message">${this.errorMessage}</p>`;
    }

    let viewContent;
    switch(this.currentRoutineView) {
        case 'menu':
            viewContent = this._renderRoutineMenu();
            break;
        case 'premade':
            if (this.selectedMesocycle) {
                viewContent = this._renderMesocyclePhases();
            } else {
                viewContent = this._renderMesocycleList();
            }
            break;
        case 'create':
            viewContent = this._renderNewTemplateForm();
            break;
        default:
            viewContent = this._renderRoutineMenu();
    }
    
    return html`
      <div class="container">
        <header class="app-header">
          <h1>Routine</h1>
          ${this.currentRoutineView !== 'menu' && !this.selectedMesocycle ? html`
              <button class="btn btn-icon" @click=${() => this.currentRoutineView = 'menu'}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
          ${this.selectedMesocycle ? html`
              <button class="btn btn-icon" @click=${() => this.selectedMesocycle = null}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
              </button>
          ` : ''}
        </header>
        ${viewContent}
      </div>
    `;
  }

  _renderRoutineMenu() {
      return html`
        <nav class="home-nav-buttons">
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'premade'}>
            <div class="hub-option-icon">📋</div>
            <div class="hub-option-text"><h3>Pre-Made Templates</h3><p>Choose from our library</p></div>
          </button>
          <button class="hub-option card-interactive" @click=${() => this.currentRoutineView = 'create'}>
            <div class="hub-option-icon">✍️</div>
            <div class="hub-option-text"><h3>Create Your Own</h3><p>Build a routine from scratch</p></div>
          </button>
        </nav>
        
        ${this.templates.length > 0 ? html`
          <h2 class="section-title">Your Templates</h2>
          <div class="templates-list">
            ${this.templates.filter(t => t.primaryFocus === "custom").map(template => html`
              <div class="card link-card template-card" @click=${() => this._loadTemplate(template)}>
                <div class="template-info">
                  <h3>${template.name}</h3>
                  <p>${template.exercises?.length || 0} exercises</p>
                </div>
                <button class="btn-icon" aria-label="Load template">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </button>
              </div>
            `)}
          </div>
        ` : ''}
      `;
  }
  
  _renderMesocycleList() {
    const filteredMesocycles = this._getFilteredMesocycles();
    const focusOptions = [...new Set(this.premadeMesocycles.map(t => t.primaryFocus))];
    const frequencyOptions = [...new Set(this.premadeMesocycles.map(t => t.daysPerWeek))].sort((a,b) => a-b);
    const genderOptions = [...new Set(this.premadeMesocycles.flatMap(t => t.genderFocus))].filter(g => g !== 'all');
    const equipmentOptions = [...new Set(this.premadeMesocycles.flatMap(t => t.equipment))];

    // Show templates from local storage if no premade mesocycles
    const templatesToShow = filteredMesocycles.length > 0 
      ? filteredMesocycles 
      : this.templates.filter(t => t.primaryFocus !== "custom");

    return html`
      ${filteredMesocycles.length === 0 && templatesToShow.length === 0 ? html`
        <div class="card">
          <p class="no-data">No pre-made templates available. Try creating your own!</p>
        </div>
      ` : ''}
      
      ${templatesToShow.length > 0 ? html`
        <div class="templates-list">
          ${templatesToShow.map(template => html`
            <div class="card link-card template-card" @click=${() => this._loadTemplate(template)}>
              <div class="template-info">
                <h3>${template.name}</h3>
                <p>${template.exercises?.length || 0} exercises</p>
              </div>
              <button class="btn-icon" aria-label="Load template">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          `)}
        </div>
      ` : ''}
    `;
  }
  
  _renderMesocyclePhases() {
      if (!this.selectedMesocycle) return html``;
      
      return html`
        <div class="mesocycle-phases-view">
          <h2>${this.selectedMesocycle.name}</h2>
          <p>Choose a phase and a workout to start.</p>
          
          ${this.selectedMesocycle.phases.map(phase => html`
            <div class="card" style="margin-bottom: var(--space-6);">
              <h3>${phase.name}</h3>
              <div class="templates-list" style="margin-top: var(--space-4);">
                ${phase.workouts.map(workout => html`
                  <div class="card link-card template-card">
                    <div class="template-info" @click=${() => this._loadTemplate(workout)}>
                      <h3>${workout.name}</h3>
                      <p>${workout.exercises.length} exercises</p>
                    </div>
                    <button class="btn-icon" @click=${() => this._loadTemplate(workout)} aria-label="Load workout">
                      ▶️
                    </button>
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
      `;
  }

  _getExercisesForGroup(groupName) {
    const normalizedGroup = groupName.toLowerCase();
    return this.exerciseDatabase[normalizedGroup] || [];
  }

  _renderNewTemplateForm() {
    const muscleGroups = Object.keys(this.exerciseDatabase);

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
                    ${muscleGroups.map(muscle => html`<option value="${muscle}" ?selected=${exercise.muscleGroup === muscle}>${muscle.charAt(0).toUpperCase() + muscle.slice(1)}</option>`)}
                  </select>

                  ${exercise.muscleGroup ? html`
                    <select class="exercise-select" .value=${exercise.name} @change=${(e) => this._handleExerciseInput(index, 'name', e.target.value)}>
                      <option value="">Select Exercise</option>
                      ${availableExercises.map(ex => html`<option value="${ex.name}" ?selected=${exercise.name === ex.name}>${ex.name}</option>`)}
                    </select>
                  ` : ''}
                </div>
                <button class="btn-icon" @click=${() => this._removeExercise(index)}>
                  ✖️
                </button>
              </div>
              <div class="exercise-details">
                <label>Sets: <input type="number" min="1" max="10" .value=${exercise.sets} @input=${(e) => this._handleExerciseInput(index, 'sets', e.target.value)}></label>
                <label>Reps: <input type="number" min="1" max="50" .value=${exercise.reps} @input=${(e) => this._handleExerciseInput(index, 'reps', e.target.value)}></label>
                <label>RIR: <input type="number" min="0" max="10" .value=${exercise.rir} @input=${(e) => this._handleExerciseInput(index, 'rir', e.target.value)}></label>
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

/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import "./motivational-elements.js";

/*
===============================================
SECTION 2: WORKOUT-SESSION COMPONENT DEFINITION
===============================================
*/
class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    isSaving: { type: Boolean },
    units: { type: String },
    workoutStartTime: { type: Number },
    stopwatchInterval: { type: Object },
    stopwatchDisplay: { type: String },
    expandedGroups: { type: Object },
  };

  constructor() {
    super();
    this.workout = null;
    this.isSaving = false;
    this.units = localStorage.getItem('units') || 'lbs';
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = null;
    this.stopwatchDisplay = "00:00";
    this.expandedGroups = {};
  }

/*
===============================================
SECTION 3: LIFECYCLE AND STOPWATCH METHODS
===============================================
*/
  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
    // Pre-expand all muscle groups by default
    if (this.workout && this.workout.exercises) {
      const allGroups = this._getGroupedExercises();
      Object.keys(allGroups).forEach(group => {
        this.expandedGroups[group] = true;
      });
      this.requestUpdate();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStopwatch();
  }

  startStopwatch() {
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = setInterval(() => {
        const elapsed = Date.now() - this.workoutStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        this.stopwatchDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  stopStopwatch() {
    clearInterval(this.stopwatchInterval);
  }

/*
===============================================
SECTION 4: EVENT HANDLERS AND WORKOUT LOGIC
===============================================
*/
  _handleSetInput(exerciseIndex, setIndex, field, value) {
    const exercise = this.workout.exercises[exerciseIndex];
    if (exercise && exercise.sets[setIndex]) {
      // SECTION 4.1: INPUT VALIDATION
      // Enforce max values for weight and reps.
      let processedValue = value;
      if (field === 'weight' && Number(value) > 999) {
        processedValue = '999';
      }
      if (field === 'reps' && Number(value) > 50) {
        processedValue = '50';
      }
      
      exercise.sets[setIndex][field] = processedValue;
      // Force a re-render to update the input field value if it was capped
      this.requestUpdate();
    }
  }

  _toggleSetComplete(exerciseIndex, setIndex) {
    const exercise = this.workout.exercises[exerciseIndex];
    if (exercise && exercise.sets[setIndex]) {
      const set = exercise.sets[setIndex];
      set.completed = !set.completed;
      this.requestUpdate();
    }
  }

  async _completeWorkout() {
    this.isSaving = true;
    try {
        this.stopStopwatch();
        const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
        
        // Calculate total volume from completed sets only
        const totalVolume = this.workout.exercises.reduce((total, exercise) => {
            const exerciseVolume = (exercise.sets || []).reduce((sum, set) => {
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps, 10) || 0;
                if (set.completed && weight > 0 && reps > 0) {
                    return sum + (weight * reps);
                }
                return sum;
            }, 0);
            return total + exerciseVolume;
        }, 0);

        // Create properly structured workout data
        const workoutToSave = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            name: this.workout.name || 'Workout Session',
            durationInSeconds,
            totalVolume: Math.round(totalVolume),
            exercises: this.workout.exercises.map(ex => ({
                name: ex.name,
                completedSets: (ex.sets || [])
                    .filter(s => s.completed && s.weight && s.reps)
                    .map(set => ({
                        weight: parseFloat(set.weight) || 0,
                        reps: parseInt(set.reps, 10) || 0,
                        rir: parseInt(set.rir, 10) || 0
                    })),
                category: this._getExerciseCategory(ex.name),
                muscleGroup: ex.muscleGroup || this._getExerciseMuscleGroup(ex.name)
            }))
            .filter(ex => ex.completedSets.length > 0), // Only include exercises with completed sets
        };

        // Ensure we have at least one completed exercise
        if (workoutToSave.exercises.length === 0) {
            throw new Error("Please complete at least one set before finishing your workout.");
        }
        
        saveDataLocally({ 
            workouts: [workoutToSave]
        });

        this.dispatchEvent(new CustomEvent('workout-completed', {
            detail: { 
                workoutData: workoutToSave,
                completedWorkoutDay: this.workout.day 
            },
            bubbles: true,
            composed: true
        }));
    } catch (error) {
        console.error("Save workout error:", error);
        this.dispatchEvent(new CustomEvent('show-toast', { 
            detail: { message: error.message, type: 'error' }, 
            bubbles: true, 
            composed: true 
        }));
    } finally {
        this.isSaving = false;
    }
  }

/*
===============================================
SECTION 5: HELPER METHODS
===============================================
*/
  // SECTION 5.1: RIR PLACEHOLDER HELPER
  // Creates the smart placeholder for the reps input field.
  _getRepPlaceholder(exercise) {
    const reps = exercise.targetReps || '8-12';
    const rir = exercise.targetRir;
    
    if (rir !== undefined && rir !== null) {
      return `${reps} / ${rir} RIR`;
    }
    return reps;
  }

  _getExerciseCategory(exerciseName) {
    const compoundExercises = [
      'squat', 'deadlift', 'bench press', 'pull-up', 'chin-up', 'row', 'press', 'lunge',
      'dip', 'clean', 'snatch', 'thruster', 'burpee', 'hip thrust', 'overhead press'
    ];
    
    const name = exerciseName.toLowerCase();
    const isCompound = compoundExercises.some(compound => name.includes(compound));
    return isCompound ? 'compound' : 'isolation';
  }

  _getExerciseMuscleGroup(exerciseName) {
    const name = exerciseName.toLowerCase();
    
    if (name.includes('bench') || name.includes('chest') || name.includes('fly') || name.includes('press-around')) return 'chest';
    if (name.includes('squat') || name.includes('quad') || name.includes('leg extension')) return 'quads';
    if (name.includes('deadlift') || name.includes('row') || name.includes('pull') || name.includes('lat') || name.includes('shrug')) return 'back';
    if (name.includes('curl') && !name.includes('leg curl')) return 'biceps';
    if (name.includes('tricep') || name.includes('pushdown') || name.includes('skullcrusher') || name.includes('dip')) return 'triceps';
    if (name.includes('shoulder') || name.includes('lateral') || name.includes('arnold') || (name.includes('press') && !name.includes('bench') && !name.includes('leg'))) return 'shoulders';
    if (name.includes('leg curl') || name.includes('hamstring') || name.includes('rdl') || name.includes('romanian')) return 'hamstrings';
    if (name.includes('hip thrust') || name.includes('glute') || name.includes('lunge')) return 'glutes';
    if (name.includes('calf')) return 'calves';
    
    return 'general';
  }

  _getGroupedExercises() {
    if (!this.workout || !this.workout.exercises) {
      return {};
    }
    return this.workout.exercises.reduce((acc, exercise, index) => {
      const group = (exercise.muscleGroup || this._getExerciseMuscleGroup(exercise.name)).toUpperCase();
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push({ ...exercise, originalIndex: index });
      return acc;
    }, {});
  }

  _toggleGroup(groupName) {
    this.expandedGroups = {
      ...this.expandedGroups,
      [groupName]: !this.expandedGroups[groupName]
    };
  }

/*
===============================================
SECTION 6: RENDERING
===============================================
*/
  render() {
    if (!this.workout || !this.workout.exercises) {
      return html`<div class="container"><div class="skeleton skeleton-text">Loading workout...</div></div>`;
    }

    const groupedExercises = this._getGroupedExercises();
    const workoutDate = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    return html`
      <div id="workout-session-view" class="container">
        <header class="workout-header">
          <div class="workout-header-content">
             <h1 class="workout-session-title">${this.workout.name}</h1>
             <p class="workout-session-subtitle">${workoutDate}</p>
          </div>
          <div class="timer-display">${this.stopwatchDisplay}</div>
        </header>
        
        <div class="workout-log-container">
          ${Object.entries(groupedExercises).map(([groupName, exercises]) => html`
            <div class="muscle-group-container">
              <button class="muscle-group-header" @click=${() => this._toggleGroup(groupName)}>
                <h2 class="muscle-group-title">${groupName}</h2>
                <span class="chevron ${this.expandedGroups[groupName] ? 'expanded' : ''}">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </span>
              </button>
              
              <div class="exercise-list-container ${this.expandedGroups[groupName] ? 'expanded' : ''}">
                ${exercises.map(exercise => html`
                  <div class="exercise-log-card">
                    <div class="exercise-log-header">
                      <div class="exercise-log-name">
                        <h3>${exercise.name}</h3>
                        <p>${exercise.targetReps || '8-12'} reps</p> 
                      </div>
                      <div class="exercise-log-actions">
                        <button class="btn-icon-sm" aria-label="Exercise Info">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                        </button>
                      </div>
                    </div>
                    <div class="log-table-header">
                      <span>SET</span>
                      <span>WEIGHT (${this.units})</span>
                      <span>REPS</span>
                      <span>LOG</span>
                    </div>
                    ${(exercise.sets || []).map((set, setIndex) => html`
                      <div class="set-row-log ${set.completed ? 'completed' : ''}">
                        <span class="set-number">${setIndex + 1}</span>
                        <!-- SECTION 6.1: INPUT FIELD UPDATES -->
                        <input 
                          type="tel"
                          inputmode="decimal"
                          pattern="[0-9]*"
                          max="999"
                          class="set-input-log" 
                          placeholder="-" 
                          .value=${set.weight || ''} 
                          @input=${(e) => this._handleSetInput(exercise.originalIndex, setIndex, 'weight', e.target.value)}
                        >
                        <input 
                          type="tel"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          max="50"
                          class="set-input-log" 
                          placeholder="${this._getRepPlaceholder(exercise)}" 
                          .value=${set.reps || ''} 
                          @input=${(e) => this._handleSetInput(exercise.originalIndex, setIndex, 'reps', e.target.value)}
                        >
                        <button 
                          class="set-log-checkbox" 
                          @click=${() => this._toggleSetComplete(exercise.originalIndex, setIndex)} 
                          aria-label="Log Set ${setIndex + 1}"
                        >
                          ${set.completed ? html`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>` : ''}
                        </button>
                      </div>
                    `)}
                  </div>
                `)}
              </div>
            </div>
          `)}
        </div>
        <div class="workout-actions">
            <button class="btn btn-secondary" @click=${() => this.dispatchEvent(new CustomEvent('workout-cancelled', { bubbles: true, composed: true }))}>
                Cancel Workout
            </button>
            <button class="btn btn-primary cta-button" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
                ${this.isSaving ? html`<div class="spinner"></div>` : 'Complete Workout'}
            </button>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}
customElements.define("workout-session", WorkoutSession);

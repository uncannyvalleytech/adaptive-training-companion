/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import { WorkoutEngine } from "../services/workout-engine.js";
import { exerciseDatabase } from "../services/exercise-database.js"; // Import the master database
import "./motivational-elements.js";
import "./workout-feedback-modal.js";

/*
===============================================
SECTION 2: WORKOUT-SESSION COMPONENT DEFINITION
===============================================
*/
// 2.A: Properties
class WorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    userData: { type: Object },
    isSaving: { type: Boolean },
    units: { type: String },
    workoutStartTime: { type: Number },
    stopwatchInterval: { type: Object },
    stopwatchDisplay: { type: String },
    activeGroupIndex: { type: Number },
    activeExerciseIndex: { type: Number },
    showFeedbackModal: { type: Boolean },
    feedbackExerciseIndex: { type: Number },
    showSubstitutionModal: { type: Boolean },
    substitutions: { type: Array },
    exerciseToSubstitute: { type: Object },
  };

// 2.B: Constructor
  constructor() {
    super();
    this.workout = null;
    this.userData = getDataLocally(); // Load user data in constructor
    this.isSaving = false;
    this.units = localStorage.getItem('units') || 'lbs';
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = null;
    this.stopwatchDisplay = "00:00";
    this.activeGroupIndex = 0;
    this.activeExerciseIndex = 0;
    this.showFeedbackModal = false;
    this.feedbackExerciseIndex = null;
    this.showSubstitutionModal = false;
    this.substitutions = [];
    this.exerciseToSubstitute = null;
    this.workoutEngine = new WorkoutEngine(this.userData); // Initialize engine with data
  }

/*
===============================================
SECTION 3: LIFECYCLE AND STOPWATCH METHODS
===============================================
*/
// 3.A: Connected Callback
  connectedCallback() {
    super.connectedCallback();
    this.startStopwatch();
    // Re-initialize engine in case user data was not available in constructor
    if (!this.workoutEngine || !this.userData) {
      this.userData = getDataLocally();
      this.workoutEngine = new WorkoutEngine(this.userData);
    }
  }

// 3.B: Disconnected Callback
  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopStopwatch();
  }

// 3.C: Start Stopwatch
  startStopwatch() {
    this.workoutStartTime = Date.now();
    this.stopwatchInterval = setInterval(() => {
        const elapsed = Date.now() - this.workoutStartTime;
        const minutes = Math.floor(elapsed / 60000);
        const seconds = Math.floor((elapsed % 60000) / 1000);
        this.stopwatchDisplay = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

// 3.D: Stop Stopwatch
  stopStopwatch() {
    clearInterval(this.stopwatchInterval);
  }

/*
===============================================
SECTION 4: EVENT HANDLERS AND WORKOUT LOGIC
===============================================
*/
// 4.A: Handle Set Input
  _handleSetInput(exerciseIndex, setIndex, field, value) {
    const exercise = this.workout.exercises[exerciseIndex];
    if (exercise && exercise.sets[setIndex]) {
      let processedValue = value;
      if (processedValue.length > 3) {
        processedValue = processedValue.slice(0, 3);
      }

      exercise.sets[setIndex][field] = processedValue;
      this.requestUpdate();
    }
  }

// 4.B: Toggle Set Complete
  _toggleSetComplete(exerciseIndex, setIndex) {
    const exercise = this.workout.exercises[exerciseIndex];
    if (exercise && exercise.sets[setIndex]) {
      const set = exercise.sets[setIndex];
      const isLastSet = setIndex === (exercise.sets.length - 1);
      
      set.completed = !set.completed;
      this.requestUpdate();
      
      if (set.completed && isLastSet) {
          const confirmation = confirm("Are you done with this exercise? Tap OK to move to the next exercise or Cancel to stay here.");
          if (confirmation) {
              this._advanceExercise();
          }
      }
    }
  }

// 4.C: Advance to Next Exercise or Group
  _advanceExercise() {
      const groupedExercises = this._getGroupedExercises();
      const groupKeys = Object.keys(groupedExercises);
      const currentGroup = groupedExercises[groupKeys[this.activeGroupIndex]];
      
      if (this.activeExerciseIndex < currentGroup.length - 1) {
          this.activeExerciseIndex++;
      } else if (this.activeGroupIndex < groupKeys.length - 1) {
          this.activeGroupIndex++;
          this.activeExerciseIndex = 0;
      } else {
          // Optional: Announce workout is complete or reset to the beginning
          // For now, let's just loop back
          this.activeGroupIndex = 0;
          this.activeExerciseIndex = 0;
      }
  }

// 4.D: Complete Workout
  async _completeWorkout() {
    this.isSaving = true;
    try {
        this.stopStopwatch();
        const durationInSeconds = Math.floor((Date.now() - this.workoutStartTime) / 1000);
        
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
            .filter(ex => ex.completedSets.length > 0),
        };

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
SECTION 5: SUBSTITUTION LOGIC
===============================================
*/
// 5.A: Show Substitution Modal
  _showSubstitutionModal(exerciseToSubstitute) {
    if (!this.workoutEngine || !this.userData) return;
    
    const allExercises = Object.values(exerciseDatabase).flat();
    const fullExerciseDetails = allExercises.find(ex => ex.name === exerciseToSubstitute.name);

    if (!fullExerciseDetails) {
        this.dispatchEvent(new CustomEvent('show-toast', { 
            detail: { message: "Could not find exercise details for substitution.", type: 'error' }, 
            bubbles: true, 
            composed: true 
        }));
        return;
    }
    
    this.exerciseToSubstitute = exerciseToSubstitute;
    const availableEquipment = this.userData.availableEquipment || [];
    
    this.substitutions = this.workoutEngine.getExerciseSubstitutions(
      fullExerciseDetails,
      availableEquipment
    );
    this.showSubstitutionModal = true;
  }

// 5.B: Handle Substitute Selection
  _handleSubstituteSelection(newExercise) {
    const originalExerciseIndex = this.exerciseToSubstitute.originalIndex;
    
    const substitutedExercise = {
      ...this.workout.exercises[originalExerciseIndex],
      name: newExercise.name,
      muscleGroup: newExercise.muscleGroup,
      movementPattern: newExercise.movementPattern,
      equipment: newExercise.equipment
    };
    
    this.workout.exercises[originalExerciseIndex] = substitutedExercise;
    
    this._closeSubstitutionModal();
    this.requestUpdate();
    
    this.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { message: `${this.exerciseToSubstitute.name} replaced with ${newExercise.name}.`, type: 'success' }, 
        bubbles: true, 
        composed: true 
    }));
  }

// 5.C: Close Substitution Modal
  _closeSubstitutionModal() {
    this.showSubstitutionModal = false;
    this.substitutions = [];
    this.exerciseToSubstitute = null;
  }

/*
===============================================
SECTION 6: HELPER METHODS
===============================================
*/
// 6.A: Get Rep Placeholder
  _getRepPlaceholder(exercise) {
    const reps = exercise.targetReps || '8-12';
    const rir = exercise.targetRir;
    
    if (rir !== undefined && rir !== null) {
      return `${reps} / ${rir} RIR`;
    }
    return reps;
  }

// 6.B: Get Exercise Category
  _getExerciseCategory(exerciseName) {
    const compoundExercises = [
      'squat', 'deadlift', 'bench press', 'pull-up', 'chin-up', 'row', 'press', 'lunge',
      'dip', 'clean', 'snatch', 'thruster', 'burpee', 'hip thrust', 'overhead press'
    ];
    
    const name = exerciseName.toLowerCase();
    const isCompound = compoundExercises.some(compound => name.includes(compound));
    return isCompound ? 'compound' : 'isolation';
  }

// 6.C: Get Exercise Muscle Group
  _getExerciseMuscleGroup(exerciseName) {
    const name = exerciseName.toLowerCase();
    
    for (const group in exerciseDatabase) {
      if (exerciseDatabase[group].some(ex => ex.name.toLowerCase() === name)) {
        return group;
      }
    }
    
    // Fallback logic
    if (name.includes('bench') || name.includes('chest') || name.includes('fly')) return 'chest';
    if (name.includes('squat') || name.includes('leg extension')) return 'quads';
    if (name.includes('deadlift') || name.includes('row') || name.includes('pull') || name.includes('lat')) return 'back';
    if (name.includes('curl')) return 'biceps';
    if (name.includes('tricep') || name.includes('pushdown') || name.includes('skullcrusher')) return 'triceps';
    if (name.includes('shoulder') || name.includes('lateral') || name.includes('press')) return 'shoulders';
    if (name.includes('leg curl') || name.includes('hamstring') || name.includes('rdl')) return 'hamstrings';
    if (name.includes('glute') || name.includes('lunge')) return 'glutes';
    if (name.includes('calf')) return 'calves';
    
    return 'general';
  }

// 6.D: Get Grouped Exercises
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

/*
===============================================
SECTION 7: RENDERING
===============================================
*/
// 7.A: Main Render Method
  render() {
    if (!this.workout || !this.workout.exercises) {
      return html`<div class="container"><div class="skeleton skeleton-text">Loading workout...</div></div>`;
    }

    const groupedExercises = this._getGroupedExercises();
    const groupKeys = Object.keys(groupedExercises);
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

        <div class="workout-session-card">
          <div class="workout-group-tabs-container">
            <div class="workout-group-tabs">
              ${groupKeys.map((group, index) => html`
                <button 
                  class="workout-group-tab-btn ${this.activeGroupIndex === index ? 'active' : ''}" 
                  @click=${() => { this.activeGroupIndex = index; this.activeExerciseIndex = 0; }}
                >
                  ${group}
                </button>
              `)}
            </div>
          </div>
          
          <div class="exercise-content-container">
            ${this._renderGroupContent(groupKeys, groupedExercises)}
          </div>
        </div>

        <div class="workout-actions">
            <button class="btn btn-secondary" @click=${() => this.dispatchEvent(new CustomEvent('workout-cancelled', { bubbles: true, composed: true }))}>
                Cancel Workout
            </button>
            <button class="btn btn-primary cta-button" @click=${this._completeWorkout} ?disabled=${this.isSaving}>
                ${this.isSaving ? html`<div class="spinner"></div>` : 'Complete Workout'}
            </button>
        </div>
        ${this.showSubstitutionModal ? this._renderSubstitutionModal() : ''}
      </div>
    `;
  }
  
// 7.B: Render Group Content
  _renderGroupContent(groupKeys, groupedExercises) {
    if (groupKeys.length === 0) return html`<p>No exercises in this workout.</p>`;
    
    const activeGroup = groupedExercises[groupKeys[this.activeGroupIndex]];
    const totalExercisesInGroup = activeGroup.length;
    
    return html`
        <div class="workout-group-content">
            <div class="exercise-tabs-container">
                <div class="exercise-tabs exercise-count-${totalExercisesInGroup}">
                    ${activeGroup.map((exercise, index) => {
                        const isCompleted = exercise.sets.every(set => set.completed);
                        const isActive = this.activeExerciseIndex === index;
                        return html`
                            <button 
                                class="exercise-tab-btn-workout ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" 
                                @click=${() => this.activeExerciseIndex = index}
                            >
                                ${index + 1}
                                ${isActive ? html`<div class="active-exercise-indicator">🔥</div>` : ''}
                            </button>
                        `;
                    })}
                </div>
            </div>
            ${this._renderExerciseContent(activeGroup)}
        </div>
    `;
  }

// 7.C: Render Exercise Content
  _renderExerciseContent(activeGroup) {
      if (activeGroup.length === 0) return html``;
      
      const exercise = activeGroup[this.activeExerciseIndex];
      if (!exercise) return html``;

      return html`
        <div class="exercise-log-card">
            <div class="exercise-log-header">
              <div class="exercise-log-name">
                <h3>${exercise.name}</h3>
                <p>${exercise.targetReps || '8-12'} reps</p> 
              </div>
              <div class="exercise-log-actions">
                 <button class="btn-icon-sm" @click=${() => this._showSubstitutionModal(exercise)} aria-label="Substitute Exercise">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <button class="btn-icon-sm" aria-label="Exercise Info">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
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
                <input 
                  type="number"
                  inputmode="decimal"
                  pattern="[0-9]*"
                  maxlength="3"
                  class="set-input-log" 
                  placeholder="-" 
                  .value=${set.weight || ''} 
                  @input=${(e) => this._handleSetInput(exercise.originalIndex, setIndex, 'weight', e.target.value)}
                >
                <input 
                  type="number"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  maxlength="3"
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
      `;
  }

// 7.D: Render Substitution Modal
_renderSubstitutionModal() {
    return html`
        <div class="modal-overlay" @click=${this._closeSubstitutionModal}>
            <div class="modal-content card" @click=${(e) => e.stopPropagation()}>
                <div class="modal-header">
                    <h3>Substitute for ${this.exerciseToSubstitute?.name}</h3>
                    <button class="close-button" @click=${this._closeSubstitutionModal}>×</button>
                </div>
                ${this.substitutions.length > 0 ? html`
                    <p class="modal-subtitle">Based on your available equipment and similar movement patterns.</p>
                    <div class="substitution-list">
                        ${this.substitutions.map(sub => html`
                            <button class="card-interactive substitute-option" @click=${() => this._handleSubstituteSelection(sub)}>
                                <div class="substitute-info">
                                    <h4>${sub.name}</h4>
                                    <p>Equipment: ${sub.equipment.join(', ')}</p>
                                </div>
                                <div class="substitute-score">Match: ${sub.matchPercentage.toFixed(0)}%</div>
                            </button>
                        `)}
                    </div>
                ` : html`
                    <p>No suitable substitutions found with your current equipment.</p>
                `}
            </div>
        </div>
    `;
}

/*
===============================================
SECTION 8: STYLES AND ELEMENT DEFINITION
===============================================
*/
// 8.A: Create Render Root
  createRenderRoot() {
    return this;
  }
}
customElements.define("workout-session", WorkoutSession);

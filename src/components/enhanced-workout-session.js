import { LitElement, html, css } from 'lit';
import { AutoRegulationEngine } from './autoregulation-engine.js';

export class EnhancedWorkoutSession extends LitElement {
  static properties = {
    workout: { type: Object },
    recoveryData: { type: Object },
    previousPerformance: { type: Object },
    currentExerciseIndex: { type: Number },
    isRestPeriod: { type: Boolean },
    restTimeRemaining: { type: Number },
    adaptiveRecommendations: { type: Array }
  };

  constructor() {
    super();
    this.autoRegEngine = new AutoRegulationEngine();
    this.currentExerciseIndex = 0;
    this.isRestPeriod = false;
    this.restTimeRemaining = 0;
    this.adaptiveRecommendations = [];
    this.initializeWorkout();
  }

  static styles = css`
    :host {
      display: block;
      max-width: 800px;
      margin: 0 auto;
      padding: 1rem;
    }
    
    .workout-container {
      background: var(--surface-primary, #1a202c);
      border-radius: 12px;
      padding: 1.5rem;
      color: var(--text-primary, #ffffff);
    }
    
    .recovery-indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--surface-secondary, #2d3748);
      border-radius: 8px;
      border-left: 4px solid var(--accent-primary, #00bfff);
    }
    
    .recovery-score {
      font-size: 1.2rem;
      font-weight: bold;
    }
    
    .exercise-card {
      background: var(--surface-secondary, #2d3748);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1rem;
      border: 2px solid transparent;
      transition: all 0.3s ease;
    }
    
    .exercise-card.active {
      border-color: var(--accent-primary, #00bfff);
      box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
    }
    
    .exercise-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .exercise-title {
      font-size: 1.3rem;
      font-weight: 600;
    }
    
    .volume-indicator {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding: 0.75rem;
      background: var(--surface-tertiary, #4a5568);
      border-radius: 6px;
    }
    
    .adaptive-suggestion {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-weight: 500;
    }
    
    .set-inputs {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    
    .set-input {
      padding: 0.75rem;
      border: 2px solid var(--border-primary, #4a5568);
      border-radius: 8px;
      background: var(--surface-primary, #1a202c);
      color: var(--text-primary, #ffffff);
      text-align: center;
      font-size: 1rem;
      transition: border-color 0.2s ease;
    }
    
    .set-input:focus {
      outline: none;
      border-color: var(--accent-primary, #00bfff);
      box-shadow: 0 0 0 3px rgba(0, 191, 255, 0.3);
    }
    
    .rest-timer {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--surface-secondary, #2d3748);
      padding: 2rem;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      z-index: 1000;
    }
    
    .timer-circle {
      width: 120px;
      height: 120px;
      margin: 0 auto 1rem;
      position: relative;
    }
    
    .timer-display {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 1.5rem;
      font-weight: bold;
    }
    
    .progression-insights {
      background: var(--surface-tertiary, #4a5568);
      padding: 1rem;
      border-radius: 8px;
      margin-top: 1rem;
    }
    
    .btn-primary {
      background: var(--accent-primary, #00bfff);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-primary:hover {
      background: var(--accent-secondary, #33ccff);
      transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
      .set-inputs {
        grid-template-columns: 1fr;
      }
      
      .volume-indicator {
        flex-direction: column;
        gap: 0.5rem;
      }
    }
  `;

  initializeWorkout() {
    if (this.recoveryData) {
      const recoveryScore = this.autoRegEngine.calculateRecoveryScore(this.recoveryData);
      this.workout = this.autoRegEngine.adjustWorkout(
        this.workout, 
        recoveryScore, 
        this.previousPerformance
      );
    }
  }

  generateAdaptiveRecommendation(exercise, setIndex, lastSet) {
    if (!lastSet || !lastSet.weight || !lastSet.reps) return null;

    const recommendation = this.autoRegEngine.generateIntraWorkoutRecommendation(
      lastSet, 
      exercise
    );
    
    return {
      exerciseIndex: this.currentExerciseIndex,
      setIndex,
      message: recommendation,
      timestamp: Date.now()
    };
  }

  handleSetComplete(exercise, setIndex, setData) {
    const recommendation = this.generateAdaptiveRecommendation(
      exercise, 
      setIndex, 
      setData
    );
    
    if (recommendation) {
      this.adaptiveRecommendations = [
        ...this.adaptiveRecommendations.filter(r => 
          !(r.exerciseIndex === recommendation.exerciseIndex && 
            r.setIndex === recommendation.setIndex)
        ),
        recommendation
      ];
    }

    // Start rest timer if not final set
    if (setIndex < exercise.targetSets - 1) {
      this.startRestTimer(exercise.restTime || 90);
    }

    this.requestUpdate();
  }

  startRestTimer(duration) {
    this.isRestPeriod = true;
    this.restTimeRemaining = duration;
    
    const timer = setInterval(() => {
      this.restTimeRemaining--;
      if (this.restTimeRemaining <= 0) {
        clearInterval(timer);
        this.isRestPeriod = false;
      }
      this.requestUpdate();
    }, 1000);
  }

  getVolumeProgress(exercise) {
    const completed = exercise.completedSets?.length || 0;
    const target = exercise.targetSets;
    const percentage = (completed / target) * 100;
    
    return {
      completed,
      target,
      percentage,
      remaining: target - completed
    };
  }

  renderRecoveryIndicator() {
    if (!this.recoveryData) return '';
    
    const score = this.autoRegEngine.calculateRecoveryScore(this.recoveryData);
    const status = score >= 7 ? 'Good' : score >= 5 ? 'Moderate' : 'Low';
    const color = score >= 7 ? '#48bb78' : score >= 5 ? '#ed8936' : '#f56565';
    
    return html`
      <div class="recovery-indicator" style="border-left-color: ${color}">
        <div>
          <strong>Recovery Status: ${status}</strong>
          <div class="recovery-score" style="color: ${color}">${score.toFixed(1)}/10</div>
        </div>
        <div style="flex: 1; text-align: right;">
          <small>Workout adjusted based on your recovery</small>
        </div>
      </div>
    `;
  }

  renderExercise(exercise, exerciseIndex) {
    const isActive = exerciseIndex === this.currentExerciseIndex;
    const progress = this.getVolumeProgress(exercise);
    const recommendation = this.adaptiveRecommendations.find(r => 
      r.exerciseIndex === exerciseIndex
    );

    return html`
      <div class="exercise-card ${isActive ? 'active' : ''}">
        <div class="exercise-header">
          <div class="exercise-title">${exercise.name}</div>
          <div class="exercise-stats">
            ${exercise.targetSets} × ${exercise.targetReps} @ RIR ${exercise.targetRIR}
          </div>
        </div>
        
        <div class="volume-indicator">
          <div>Sets: ${progress.completed}/${progress.target}</div>
          <div>Target Load: ${exercise.targetLoad}lbs</div>
          <div>Progress: ${progress.percentage.toFixed(0)}%</div>
        </div>
        
        ${recommendation ? html`
          <div class="adaptive-suggestion">
            💡 ${recommendation.message}
          </div>
        ` : ''}
        
        ${isActive ? this.renderActiveExerciseInputs(exercise, exerciseIndex) : ''}
        
        ${exercise.completedSets?.length > 0 ? html`
          <div class="progression-insights">
            <strong>Completed Sets:</strong>
            ${exercise.completedSets.map((set, i) => html`
              <div>Set ${i + 1}: ${set.weight}lbs × ${set.reps} (RIR ${set.rir})</div>
            `)}
          </div>
        ` : ''}
      </div>
    `;
  }

  renderActiveExerciseInputs(exercise, exerciseIndex) {
    const currentSet = (exercise.completedSets?.length || 0) + 1;
    
    return html`
      <div class="active-exercise-inputs">
        <h4>Set ${currentSet}</h4>
        <div class="set-inputs">
          <input 
            type="number" 
            class="set-input" 
            placeholder="Weight" 
            id="weight-${exerciseIndex}"
            min="0"
            step="0.5"
          >
          <input 
            type="number" 
            class="set-input" 
            placeholder="Reps" 
            id="reps-${exerciseIndex}"
            min="1"
          >
          <input 
            type="number" 
            class="set-input" 
            placeholder="RIR" 
            id="rir-${exerciseIndex}"
            min="0"
            max="10"
          >
        </div>
        <button 
          class="btn-primary" 
          @click=${() => this.completeSet(exercise, exerciseIndex)}
        >
          Complete Set
        </button>
      </div>
    `;
  }

  completeSet(exercise, exerciseIndex) {
    const weightInput = this.shadowRoot.getElementById(`weight-${exerciseIndex}`);
    const repsInput = this.shadowRoot.getElementById(`reps-${exerciseIndex}`);
    const rirInput = this.shadowRoot.getElementById(`rir-${exerciseIndex}`);
    
    const setData = {
      weight: parseFloat(weightInput.value) || 0,
      reps: parseInt(repsInput.value) || 0,
      rir: parseInt(rirInput.value) || 0,
      timestamp: Date.now()
    };

    if (!exercise.completedSets) {
      exercise.completedSets = [];
    }
    exercise.completedSets.push(setData);

    // Clear inputs
    weightInput.value = '';
    repsInput.value = '';
    rirInput.value = '';

    this.handleSetComplete(exercise, exercise.completedSets.length - 1, setData);

    // Move to next exercise if current is complete
    if (exercise.completedSets.length >= exercise.targetSets) {
      if (this.currentExerciseIndex < this.workout.exercises.length - 1) {
        this.currentExerciseIndex++;
      }
    }
  }

  renderRestTimer() {
    if (!this.isRestPeriod) return '';

    const minutes = Math.floor(this.restTimeRemaining / 60);
    const seconds = this.restTimeRemaining % 60;
    const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    return html`
      <div class="rest-timer">
        <div class="timer-circle">
          <div class="timer-display">${timeString}</div>
        </div>
        <h3>Rest Period</h3>
        <p>Prepare for your next set</p>
        <button class="btn-primary" @click=${() => this.isRestPeriod = false}>
          Skip Rest
        </button>
      </div>
    `;
  }

  render() {
    if (!this.workout) {
      return html`<div>Loading workout...</div>`;
    }

    return html`
      <div class="workout-container">
        ${this.renderRecoveryIndicator()}
        
        <h1>${this.workout.name}</h1>
        
        <div class="exercises">
          ${this.workout.exercises.map((exercise, index) => 
            this.renderExercise(exercise, index)
          )}
        </div>
        
        <div class="workout-actions">
          <button class="btn-primary" @click=${this.completeWorkout}>
            Complete Workout
          </button>
        </div>
      </div>
      
      ${this.renderRestTimer()}
    `;
  }

  completeWorkout() {
    // Generate progression recommendations for next session
    const progressions = this.workout.exercises.map(exercise => {
      if (exercise.completedSets?.length > 0) {
        return this.autoRegEngine.progressExercise(exercise, exercise.completedSets);
      }
      return null;
    }).filter(Boolean);

    this.dispatchEvent(new CustomEvent('workout-complete', {
      detail: {
        workout: this.workout,
        progressions,
        totalVolume: this.calculateTotalVolume(),
        duration: Date.now() - this.workoutStartTime
      }
    }));
  }

  calculateTotalVolume() {
    return this.workout.exercises.reduce((total, exercise) => {
      return total + (exercise.completedSets || []).reduce((exerciseTotal, set) => {
        return exerciseTotal + (set.weight * set.reps);
      }, 0);
    }, 0);
  }
}

customElements.define('enhanced-workout-session', EnhancedWorkoutSession);

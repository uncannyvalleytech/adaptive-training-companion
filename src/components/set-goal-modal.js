
/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
// 1.A: Import Core Libraries
import { LitElement, html } from "lit";
// 1.B: Import Services
import { exerciseDatabase } from "../services/exercise-database.js";

/*
===============================================
SECTION 2: SET-GOAL-MODAL COMPONENT DEFINITION
===============================================
*/
// 2.A: Properties
class SetGoalModal extends LitElement {
  static properties = {
    onClose: { type: Function },
    onSetGoal: { type: Function },
    goalData: { type: Object },
    units: { type: String },
  };

// 2.B: Constructor
  constructor() {
    super();
    this.goalData = {
      type: 'performance',
      exercise: '',
      targetWeight: '',
      targetReps: '',
      startDate: new Date().toISOString(),
      completed: false,
    };
    this.units = localStorage.getItem('units') || 'lbs';
    this.allExercises = Object.values(exerciseDatabase).flat();
  }

/*
===============================================
SECTION 3: EVENT HANDLERS
===============================================
// 3.A: Handle Input
  _handleInput(field, value) {
    // SECTION 3.1: CORRECTED INPUT VALIDATION
    // Ensure the input value is limited to 3 digits.
    let processedValue = value;
    if (processedValue.length > 3) {
      processedValue = processedValue.slice(0, 3);
    }
    
    this.goalData = { ...this.goalData, [field]: processedValue };
    this.requestUpdate();
  }

// 3.B: Handle Submit
  _handleSubmit() {
    if (this.onSetGoal) {
      if (!this.goalData.exercise || !this.goalData.targetWeight || !this.goalData.targetReps) {
          // You can dispatch a toast event here for better UX
          console.error("Please fill all fields");
          return;
      }
      this.onSetGoal(this.goalData);
    }
  }

// 3.C: Handle Close
  _handleClose() {
    if (this.onClose) {
      this.onClose();
    }
  }

// 3.D: Handle Overlay Click
  _handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      this._handleClose();
    }
  }

/*
===============================================
SECTION 4: RENDERING LOGIC
===============================================
*/
// 4.A: Main Render Method
  render() {
    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content card">
          <div class="modal-header">
            <h2 id="modal-title">Set a New Performance Goal</h2>
            <button class="close-button" @click=${this._handleClose} aria-label="Close modal">✖</button>
          </div>
          
          <div class="form-inputs">
            <div class="input-group">
              <label for="goal-exercise">Exercise</label>
              <select 
                id="goal-exercise" 
                @change=${(e) => this._handleInput('exercise', e.target.value)}
                .value=${this.goalData.exercise}
              >
                <option value="">Select an exercise...</option>
                ${this.allExercises.map(ex => html`<option value="${ex.name}">${ex.name}</option>`)}
              </select>
            </div>

            <div class="input-group">
              <label for="goal-weight">Target Weight (${this.units})</label>
              <input
                id="goal-weight"
                type="number"
                maxlength="3"
                .value=${this.goalData.targetWeight}
                @input=${(e) => this._handleInput('targetWeight', e.target.value)}
                placeholder="e.g., 225"
              />
            </div>

            <div class="input-group">
              <label for="goal-reps">Target Reps</label>
              <input
                id="goal-reps"
                type="number"
                maxlength="3"
                .value=${this.goalData.targetReps}
                @input=${(e) => this._handleInput('targetReps', e.target.value)}
                placeholder="e.g., 5"
              />
            </div>
          </div>

          <div class="button-group">
            <button class="secondary-button" @click=${this._handleClose}>Cancel</button>
            <button class="cta-button" @click=${this._handleSubmit}>Set Goal</button>
          </div>
        </div>
      </div>
    `;
  }

/*
===============================================
SECTION 5: STYLES AND ELEMENT DEFINITION
===============================================
*/
// 5.A: Create Render Root
  createRenderRoot() {
    return this;
  }
}

// 5.B: Custom Element Definition
customElements.define("set-goal-modal", SetGoalModal);

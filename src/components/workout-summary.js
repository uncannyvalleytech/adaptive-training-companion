/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html } from "lit";
import "./motivational-elements.js";

/*
===============================================
SECTION 2: WORKOUT-SUMMARY COMPONENT DEFINITION
===============================================
*/
class WorkoutSummary extends LitElement {
  static properties = {
    workoutData: { type: Object },
    userData: { type: Object },
    xpGained: { type: Number },
  };

  constructor() {
    super();
    this.workoutData = null;
    this.userData = null;
    this.xpGained = 0;
  }

/*
===============================================
SECTION 3: LIFECYCLE AND DATA CALCULATION
===============================================
*/

  connectedCallback() {
    super.connectedCallback();
    this.calculateXP();
  }

  calculateXP() {
    if (!this.workoutData) {
      this.xpGained = 0;
      return;
    }
    // Simple XP calculation: 1 XP for every 10 lbs/kg of volume
    const xp = Math.round(this.workoutData.totalVolume / 10);
    this.xpGained = xp;
  }

  _formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

/*
===============================================
SECTION 4: EVENT HANDLERS
===============================================
*/

  _handleContinue() {
    this.dispatchEvent(new CustomEvent('summary-continue', {
        detail: {
            xpGained: this.xpGained
        },
        bubbles: true,
        composed: true
    }));
  }

/*
===============================================
SECTION 5: RENDERING LOGIC
===============================================
*/

  render() {
    if (!this.workoutData || !this.userData) {
      return html`<p>Loading summary...</p>`;
    }

    const { name, totalVolume, durationInSeconds, exercises } = this.workoutData;
    const { level, totalXP } = this.userData;
    const xpToNextLevel = 1000;
    const xpAfterWorkout = totalXP + this.xpGained;
    const newLevel = Math.floor(xpAfterWorkout / xpToNextLevel) + 1;

    return html`
      <div class="container workout-summary-container">
        <div class="card celebration-card">
          <h1 class="summary-title">Workout Complete!</h1>
          <p class="summary-subtitle">Fantastic work on completing ${name}.</p>

          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-value">${totalVolume.toLocaleString()}</div>
              <div class="stat-label">Total Volume</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${this._formatDuration(durationInSeconds)}</div>
              <div class="stat-label">Duration</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${exercises.length}</div>
              <div class="stat-label">Exercises</div>
            </div>
          </div>
        </div>

        <div class="card xp-card">
          <h2 class="xp-title">Level Up!</h2>
          <div class="xp-gained">+${this.xpGained} XP</div>
          
          <level-progress 
            .currentLevel=${newLevel}
            .currentXP=${xpAfterWorkout}
            .xpToNext=${xpToNextLevel}
          ></level-progress>
        </div>
        
        <button class="btn btn-primary cta-button" @click=${this._handleContinue}>
          Continue
        </button>
      </div>
    `;
  }

/*
===============================================
SECTION 6: STYLES AND ELEMENT DEFINITION
===============================================
*/
  createRenderRoot() {
    return this;
  }
}

customElements.define("workout-summary", WorkoutSummary);

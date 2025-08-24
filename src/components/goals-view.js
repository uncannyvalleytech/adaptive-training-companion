/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import "./set-goal-modal.js";

/*
===============================================
SECTION 2: GOALS-VIEW COMPONENT DEFINITION
===============================================
*/
class GoalsView extends LitElement {
  static properties = {
    goals: { type: Array },
    isLoading: { type: Boolean },
    showSetGoalModal: { type: Boolean },
  };

  constructor() {
    super();
    this.goals = [];
    this.isLoading = true;
    this.showSetGoalModal = false;
  }

/*
===============================================
SECTION 3: LIFECYCLE AND DATA FETCHING
===============================================
*/
  connectedCallback() {
    super.connectedCallback();
    this._fetchGoals();
  }

  _fetchGoals() {
    this.isLoading = true;
    try {
      const data = getDataLocally();
      this.goals = data?.goals || [];
    } catch (error) {
      console.error("Failed to load goals:", error);
    } finally {
      this.isLoading = false;
    }
  }

/*
===============================================
SECTION 4: EVENT HANDLERS AND LOGIC
===============================================
*/

  _handleSetGoal(e) {
    const newGoal = e.detail;
    newGoal.id = Date.now().toString(); // Assign a unique ID
    this.goals = [...this.goals, newGoal];
    saveDataLocally({ goals: this.goals });
    this.showSetGoalModal = false;
    this.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: 'New goal has been set!', type: 'success' },
        bubbles: true,
        composed: true,
    }));
  }

/*
===============================================
SECTION 5: RENDERING LOGIC
===============================================
*/

  render() {
    if (this.isLoading) {
      return html`<div class="container"><p>Loading goals...</p></div>`;
    }

    return html`
      <div class="container">
        <header class="app-header">
          <h1>Your Goals</h1>
          <button class="btn btn-icon" @click=${() => this.showSetGoalModal = true}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        ${this.goals.length === 0
          ? html`
              <div class="card empty-state-container">
                <h3>No Goals Yet</h3>
                <p>Set a new goal to start tracking your progress!</p>
                <button class="btn btn-primary" @click=${() => this.showSetGoalModal = true}>
                  Set a New Goal
                </button>
              </div>
            `
          : html`
              <div class="goals-list">
                ${this.goals.map(goal => html`
                  <div class="card goal-card">
                    <h4>${goal.exercise}</h4>
                    <p>Target: ${goal.targetWeight} ${goal.units} x ${goal.targetReps} reps</p>
                    <div class="progress-bar">
                      <div class="progress-fill" style="width: 0%;"></div>
                    </div>
                  </div>
                `)}
              </div>
            `}
      </div>

      ${this.showSetGoalModal 
        ? html`<set-goal-modal .onClose=${() => this.showSetGoalModal = false} .onSetGoal=${(goal) => this._handleSetGoal({ detail: goal })}></set-goal-modal>` 
        : ''}
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

customElements.define("goals-view", GoalsView);

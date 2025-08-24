/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html } from "lit";
import { getDataLocally } from "../services/local-storage.js";

/*
===============================================
SECTION 2: GOALS-VIEW COMPONENT DEFINITION
===============================================
*/
class GoalsView extends LitElement {
  static properties = {
    goals: { type: Array },
    isLoading: { type: Boolean },
  };

  constructor() {
    super();
    this.goals = [];
    this.isLoading = true;
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
SECTION 4: RENDERING LOGIC
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
          <button class="btn btn-icon" @click=${() => console.log('Add new goal')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
        </header>

        ${this.goals.length === 0
          ? html`
              <div class="card empty-state-container">
                <h3>No Goals Yet</h3>
                <p>Set a new goal to start tracking your progress!</p>
                <button class="btn btn-primary" @click=${() => console.log('Add new goal')}>
                  Set a New Goal
                </button>
              </div>
            `
          : html`
              <div class="goals-list">
                </div>
            `}
      </div>
    `;
  }

/*
===============================================
SECTION 5: STYLES AND ELEMENT DEFINITION
===============================================
*/
  createRenderRoot() {
    return this;
  }
}

customElements.define("goals-view", GoalsView);

import { LitElement, html } from "lit";

class RoutineSelector extends LitElement {
  static properties = {};

  constructor() {
    super();
  }

  render() {
    return html`
      <div class="container routine-selector">
        <header class="app-header">
          <h1>New Routine</h1>
        </header>

        <div class="options-list">
          <div class="option-card card card-interactive">
            <div class="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M2 12h20M17 17l-5 5-5-5M17 7l-5-5-5 5"/></svg>
            </div>
            <div class="option-content">
              <h3>Build My Own</h3>
              <p>Create a custom training plan from scratch</p>
            </div>
            <div class="option-chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
          <div class="option-card card card-interactive">
            <div class="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18M18 18V6l-5 5-5-5-5 5"></path></svg>
            </div>
            <div class="option-content">
              <h3>Premade Templates</h3>
              <p>Start with a research-backed program</p>
            </div>
            <div class="option-chevron">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("routine-selector", RoutineSelector);

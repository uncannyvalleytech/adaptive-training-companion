import { LitElement, html, css } from "lit";

class ReadinessModal extends LitElement {
  static properties = {
    readinessData: { type: Object },
    onClose: { type: Function },
    onSubmit: { type: Function },
  };

  // SECTION 1: STYLES
  // Styles have been further adjusted to be more compact and prevent scrolling.
  static styles = css`
    .modal-content {
      padding: var(--space-4); /* 16px */
      max-height: 95vh;
      overflow-y: auto;
    }
    .modal-header {
      margin-bottom: var(--space-2); /* 8px */
    }
    #modal-title {
      font-size: var(--font-size-xl); /* 1.5rem */
      margin-bottom: 0;
    }
    .modal-subtitle {
      font-size: var(--font-size-sm); /* 0.875rem */
      margin-bottom: var(--space-4); /* 16px */
      line-height: 1.4;
    }
    .form-inputs {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: var(--space-3); /* 12px */
    }
    .slider-group {
      margin-bottom: 0;
    }
    .slider-group label {
      font-size: var(--font-size-sm);
      margin-bottom: var(--space-1); /* 4px */
    }
    .button-group {
      margin-top: var(--space-5); /* 20px */
      display: flex;
      flex-direction: column;
      gap: var(--space-3); /* 12px */
    }
    .cta-button, .secondary-button {
      width: 100%;
    }
  `;

  constructor() {
    super();
    this.readinessData = {
      sleep_quality: 7,
      energy_level: 7,
      motivation: 7,
      muscle_soreness: 3, // Lower is better
    };
  }
  
 // SECTION 2: EVENT HANDLERS
  _handleRatingInput(field, value) {
    this.readinessData = { ...this.readinessData, [field]: Number(value) };
    this.requestUpdate();
  }

  _handleSubmit() {
    if (this.onSubmit) {
      this.onSubmit(this.readinessData);
    }
  }

  _handleClose() {
    if (this.onClose) {
      this.onClose();
    }
  }

  _handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      this._handleClose();
    }
  }

  // SECTION 3: RENDER METHOD
  render() {
    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content card">
          <div class="modal-header">
            <h2 id="modal-title">Daily Readiness</h2>
            <button class="close-button" @click=${this._handleClose} aria-label="Close readiness modal">✖</button>
          </div>
          <p class="modal-subtitle">How are you feeling today? This helps us adjust your workout for the best results.</p>
          
          <div class="form-inputs">
            <div class="rating-group">
              <label for="sleep_quality">Sleep Quality: <strong>${this.readinessData.sleep_quality}</strong></label>
              <div class="rating-buttons">
                ${Array.from({length: 10}, (_, i) => {
                  const value = i + 1;
                  return html`
                    <button 
                      class="rating-btn ${this.readinessData.sleep_quality === value ? 'selected' : ''}"
                      @click=${() => this._handleRatingInput('sleep_quality', value)}
                    >
                      ${value}
                    </button>
                  `;
                })}
              </div>
              <div class="rating-labels">
                <span>Poor</span>
                <span>Excellent</span>
              </div>
            </div>

            <div class="rating-group">
              <label for="energy_level">Energy Level: <strong>${this.readinessData.energy_level}</strong></label>
              <div class="rating-buttons">
                ${Array.from({length: 10}, (_, i) => {
                  const value = i + 1;
                  return html`
                    <button 
                      class="rating-btn ${this.readinessData.energy_level === value ? 'selected' : ''}"
                      @click=${() => this._handleRatingInput('energy_level', value)}
                    >
                      ${value}
                    </button>
                  `;
                })}
              </div>
              <div class="rating-labels">
                <span>Exhausted</span>
                <span>Energized</span>
              </div>
            </div>

            <div class="rating-group">
              <label for="motivation">Motivation: <strong>${this.readinessData.motivation}</strong></label>
              <div class="rating-buttons">
                ${Array.from({length: 10}, (_, i) => {
                  const value = i + 1;
                  return html`
                    <button 
                      class="rating-btn ${this.readinessData.motivation === value ? 'selected' : ''}"
                      @click=${() => this._handleRatingInput('motivation', value)}
                    >
                      ${value}
                    </button>
                  `;
                })}
              </div>
              <div class="rating-labels">
                <span>None</span>
                <span>Very High</span>
              </div>
            </div>

            <div class="rating-group">
              <label for="muscle_soreness">Muscle Soreness: <strong>${this.readinessData.muscle_soreness}</strong></label>
              <div class="rating-buttons">
                ${Array.from({length: 10}, (_, i) => {
                  const value = i + 1;
                  return html`
                    <button 
                      class="rating-btn ${this.readinessData.muscle_soreness === value ? 'selected' : ''}"
                      @click=${() => this._handleRatingInput('muscle_soreness', value)}
                    >
                      ${value}
                    </button>
                  `;
                })}
              </div>
              <div class="rating-labels">
                <span>None</span>
                <span>Very Sore</span>
              </div>
            </div>
          </div>

          <div class="button-group">
            <button class="cta-button" @click=${this._handleSubmit}>Start Adjusted Workout</button>
            <button class="secondary-button" @click=${this._handleClose}>Skip & Use Planned Workout</button>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("readiness-modal", ReadinessModal);

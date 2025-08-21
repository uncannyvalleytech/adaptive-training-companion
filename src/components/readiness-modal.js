import { LitElement, html } from "lit";

class ReadinessModal extends LitElement {
  static properties = {
    readinessData: { type: Object },
    onClose: { type: Function },
    onSubmit: { type: Function },
  };

  constructor() {
    super();
    this.readinessData = {
      sleep_quality: 7,
      energy_level: 7,
      motivation: 7,
      muscle_soreness: 3, // Lower is better
    };
  }
  
  _handleSliderInput(e) {
    const { field } = e.target.dataset;
    const value = e.target.value;
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

  // This function ensures the modal only closes on a direct click to the overlay
  _handleOverlayClick(e) {
    if (e.target === e.currentTarget) {
      this._handleClose();
    }
  }

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
            <div class="input-group slider-group">
              <label for="sleep_quality">Sleep Quality: <strong>${this.readinessData.sleep_quality}</strong></label>
              <input
                type="range"
                id="sleep_quality"
                .value=${this.readinessData.sleep_quality}
                data-field="sleep_quality"
                @input=${this._handleSliderInput}
                min="1" max="10" step="1"
              />
            </div>
            <div class="input-group slider-group">
              <label for="energy_level">Energy Level: <strong>${this.readinessData.energy_level}</strong></label>
              <input
                type="range"
                id="energy_level"
                .value=${this.readinessData.energy_level}
                data-field="energy_level"
                @input=${this._handleSliderInput}
                min="1" max="10" step="1"
              />
            </div>
            <div class="input-group slider-group">
              <label for="motivation">Motivation: <strong>${this.readinessData.motivation}</strong></label>
              <input
                type="range"
                id="motivation"
                .value=${this.readinessData.motivation}
                data-field="motivation"
                @input=${this._handleSliderInput}
                min="1" max="10" step="1"
              />
            </div>
            <div class="input-group slider-group">
              <label for="muscle_soreness">Muscle Soreness: <strong>${this.readinessData.muscle_soreness}</strong></label>
              <input
                type="range"
                id="muscle_soreness"
                .value=${this.readinessData.muscle_soreness}
                data-field="muscle_soreness"
                @input=${this._handleSliderInput}
                min="1" max="10" step="1"
              />
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

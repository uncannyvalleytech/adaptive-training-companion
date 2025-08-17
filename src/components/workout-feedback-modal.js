
/**
 * @file workout-feedback-modal.js
 * This component provides a pop-up modal to collect exercise-specific feedback from the user.
 * It's designed to be reusable and can display different questions and response options
 * based on the 'feedbackData' property passed to it.
 */

import { LitElement, html, css } from "lit";

class WorkoutFeedbackModal extends LitElement {
  static properties = {
    // An object containing the questions and options to display.
    // Example: {
    //   "Joint Pain?": ["None", "Low Pain", "Moderate Pain", "A Lot of Pain"],
    //   "Biceps Pump": ["Low Pump", "Moderate Pump", "Amazing Pump"]
    // }
    feedbackData: { type: Object },
    // An event handler to call when the user submits their feedback.
    onFeedbackSubmit: { type: Function },
    // An event handler to call when the user closes the modal without submitting.
    onClose: { type: Function },
  };

  constructor() {
    super();
    this.feedbackData = {};
    this.onFeedbackSubmit = () => {};
    this.onClose = () => {};
    // Store selected feedback internally
    this._selectedFeedback = {};
  }

  static styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.75);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }
    .modal-content {
      background-color: var(--color-background);
      padding: 2rem;
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-md);
      max-width: 500px;
      width: 90%;
      position: relative;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    .modal-header h2 {
      margin: 0;
    }
    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      color: var(--color-text-primary);
      cursor: pointer;
    }
    .feedback-question {
      margin-bottom: 1.5rem;
    }
    .question-title {
      font-weight: bold;
      margin-bottom: 0.5rem;
      color: var(--color-text-secondary);
    }
    .options-group {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .option-btn {
      padding: 0.75rem 1.25rem;
      border: 1px solid var(--color-border);
      border-radius: var(--border-radius);
      background-color: var(--color-surface);
      color: var(--color-text-primary);
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .option-btn:hover {
      background-color: var(--color-border);
    }
    .option-btn.selected {
      background-color: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .submit-btn {
      width: 100%;
      padding: 1rem;
      background-color: green;
      color: white;
      border: none;
      border-radius: var(--border-radius);
      cursor: pointer;
      margin-top: 1rem;
      font-weight: bold;
    }
  `;

  render() {
    // Don't render if there's no feedback data
    if (Object.keys(this.feedbackData).length === 0) {
      return html``;
    }

    return html`
      <div class="modal-overlay">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Feedback</h2>
            <button class="close-btn" @click=${this.onClose}>&times;</button>
          </div>
          
          ${Object.entries(this.feedbackData).map(([question, options]) => html`
            <div class="feedback-question">
              <div class="question-title">${question}</div>
              <div class="options-group">
                ${options.map(option => html`
                  <button
                    class="option-btn ${this._selectedFeedback[question] === option ? 'selected' : ''}"
                    @click=${() => this._handleOptionSelect(question, option)}
                  >
                    ${option}
                  </button>
                `)}
              </div>
            </div>
          `)}

          <button class="submit-btn" @click=${this._handleSubmit}>
            Submit Feedback
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Handles the selection of a feedback option.
   * @param {string} question - The question being answered.
   * @param {string} option - The selected option.
   */
  _handleOptionSelect(question, option) {
    this._selectedFeedback = {
      ...this._selectedFeedback,
      [question]: option,
    };
    this.requestUpdate();
  }

  /**
   * Handles the submission of the feedback.
   */
  _handleSubmit() {
    this.onFeedbackSubmit(this._selectedFeedback);
  }
}

customElements.define("workout-feedback-modal", WorkoutFeedbackModal);

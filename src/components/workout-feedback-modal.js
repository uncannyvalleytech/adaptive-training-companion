/**
 * @file workout-feedback-modal.js
 * This component renders a modal dialog for collecting user feedback
 * after completing a set during a workout session.
 */

import { LitElement, html, css } from "lit";

class WorkoutFeedbackModal extends LitElement {
  static properties = {
    feedbackData: { type: Object },
    onFeedbackSubmit: { type: Function },
    onClose: { type: Function },
    selectedAnswers: { type: Object }
  };

  constructor() {
    super();
    this.feedbackData = {};
    this.selectedAnswers = {};
  }

  static styles = css`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background-color: var(--color-background, #ffffff);
      border-radius: var(--border-radius, 0.5rem);
      padding: 2rem;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: var(--shadow-md, 0 4px 6px rgba(0, 0, 0, 0.1));
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .modal-title {
      margin: 0;
      color: var(--color-text-primary, #212529);
    }

    .close-button {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--color-text-secondary, #6c757d);
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-button:hover {
      color: var(--color-text-primary, #212529);
    }

    .question-group {
      margin-bottom: 1.5rem;
    }

    .question-title {
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--color-text-primary, #212529);
    }

    .answer-options {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .answer-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .answer-option input[type="radio"] {
      margin: 0;
    }

    .answer-option label {
      cursor: pointer;
      color: var(--color-text-primary, #212529);
    }

    .submit-section {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border, #dee2e6);
    }

    .submit-button {
      padding: 0.75rem 1.5rem;
      background-color: var(--color-primary, #0d6efd);
      color: white;
      border: none;
      border-radius: var(--border-radius, 0.5rem);
      cursor: pointer;
      font-weight: 500;
    }

    .submit-button:hover {
      background-color: var(--color-primary-hover, #0b5ed7);
    }

    .submit-button:disabled {
      background-color: var(--color-text-secondary, #6c757d);
      cursor: not-allowed;
    }

    .cancel-button {
      padding: 0.75rem 1.5rem;
      background-color: transparent;
      color: var(--color-text-secondary, #6c757d);
      border: 1px solid var(--color-border, #dee2e6);
      border-radius: var(--border-radius, 0.5rem);
      cursor: pointer;
      font-weight: 500;
    }

    .cancel-button:hover {
      background-color: var(--color-surface, #f8f9fa);
    }
  `;

  render() {
    const questions = Object.keys(this.feedbackData);
    const allQuestionsAnswered = questions.every(question => 
      this.selectedAnswers[question] !== undefined
    );

    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content" @click=${this._stopPropagation}>
          <div class="modal-header">
            <h3 class="modal-title">How was that set?</h3>
            <button class="close-button" @click=${this._handleClose}>×</button>
          </div>

          ${questions.map(question => html`
            <div class="question-group">
              <div class="question-title">${question}</div>
              <div class="answer-options">
                ${this.feedbackData[question].map(option => html`
                  <div class="answer-option">
                    <input
                      type="radio"
                      id="${this._getInputId(question, option)}"
                      name="${question}"
                      value="${option}"
                      @change=${(e) => this._handleAnswerChange(question, e.target.value)}
                      .checked=${this.selectedAnswers[question] === option}
                    />
                    <label for="${this._getInputId(question, option)}">${option}</label>
                  </div>
                `)}
              </div>
            </div>
          `)}

          <div class="submit-section">
            <button class="cancel-button" @click=${this._handleClose}>
              Skip
            </button>
            <button 
              class="submit-button" 
              @click=${this._handleSubmit}
              ?disabled=${!allQuestionsAnswered}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    `;
  }

  _getInputId(question, option) {
    return `${question.replace(/\s+/g, '-')}-${option.replace(/\s+/g, '-')}`.toLowerCase();
  }

  _handleAnswerChange(question, value) {
    this.selectedAnswers = {
      ...this.selectedAnswers,
      [question]: value
    };
  }

  _handleSubmit() {
    if (this.onFeedbackSubmit) {
      this.onFeedbackSubmit(this.selectedAnswers);
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

  _stopPropagation(e) {
    e.stopPropagation();
  }
}

customElements.define("workout-feedback-modal", WorkoutFeedbackModal);

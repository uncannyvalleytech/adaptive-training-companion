/**
 * @file workout-feedback-modal.js
 * This component renders a modal dialog for collecting user feedback
 * after completing a set during a workout session.
 */

import { LitElement, html, css } from "lit";
import "../style.css"; // Import the main stylesheet

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

  static styles = []; // The component's styles will now be handled by the imported stylesheet.

  render() {
    const questions = Object.keys(this.feedbackData);
    const allQuestionsAnswered = questions.every(question => 
      this.selectedAnswers[question] !== undefined
    );

    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content glass-card" @click=${this._stopPropagation}>
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
            <button class="cancel-button btn-secondary" @click=${this._handleClose}>
              Skip
            </button>
            <button 
              class="submit-button btn-primary" 
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

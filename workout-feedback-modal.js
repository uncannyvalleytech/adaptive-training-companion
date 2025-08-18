/**
 * @file workout-feedback-modal.js
 * This component renders a modal dialog for collecting user feedback
 * after completing a set during a workout session.
 */

import { LitElement, html } from "lit";

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

  static styles = [];

  firstUpdated() {
    const firstRadio = this.shadowRoot.querySelector('input[type="radio"]');
    if (firstRadio) {
      firstRadio.focus();
    }
  }

  _getOptionIcon(option) {
    const icons = {
      'None': '😊',
      'Low Pain': '😐',
      'Moderate Pain': '😟',
      'A Lot of Pain': '😫',
      'Never Got Sore': '💪',
      'Healed a While Ago': '👌',
      'Healed Just on Time': '👍',
      'I\'m Still Sore!': '😩',
      'Low Pump': '💧',
      'Moderate Pump': '💦',
      'Amazing Pump': '🔥',
      'Easy': '😌',
      'Pretty Good': '🙂',
      'Pushed My Limits': '🥵',
      'Too Much': '😵',
    };
    return icons[option] || '';
  }

  render() {
    const questions = Object.keys(this.feedbackData);
    const allQuestionsAnswered = questions.every(question => 
      this.selectedAnswers[question] !== undefined
    );

    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="card modal-content" 
             role="dialog" 
             aria-modal="true" 
             aria-labelledby="modal-title"
             @keydown=${this._handleKeydown}>
          <div class="modal-header">
            <h3 id="modal-title" class="modal-title">How was that set?</h3>
            <button class="close-button" @click=${this._handleClose} aria-label="Close feedback modal">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          ${questions.map(question => html`
            <div class="question-group" role="group" aria-labelledby="question-title-${question}">
              <div id="question-title-${question}" class="question-title">${question}</div>
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
                    <label for="${this._getInputId(question, option)}">
                      <span class="option-icon">${this._getOptionIcon(option)}</span>
                      <span class="option-text">${option}</span>
                    </label>
                  </div>
                `)}
              </div>
            </div>
          `)}

          <div class="submit-section">
            <button class="btn-secondary" @click=${this._handleClose}>
              Skip
            </button>
            <button 
              class="btn-primary" 
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

  _handleKeydown(e) {
    if (e.key === 'Escape') {
      this._handleClose();
    }
  }
}

customElements.define("workout-feedback-modal", WorkoutFeedbackModal);

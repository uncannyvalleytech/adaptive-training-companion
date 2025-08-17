/**
 * @file onboarding-flow.js
 * This component guides new users through a brief introduction
 * to the app's features and concepts.
 */

import { LitElement, html } from "lit";

class OnboardingFlow extends LitElement {
  static properties = {
    step: { type: Number },
  };

  constructor() {
    super();
    this.step = 0;
    this.steps = [
      {
        title: "Welcome to Your Adaptive Training Companion!",
        content: "This isn't just another workout log. We use your feedback to create a personalized training plan that adapts and grows with you.",
        icon: "👋",
      },
      {
        title: "How It Works: Listen to Your Body",
        content: "After each set, you'll get a suggestion for your next one. We'll ask for your feedback on things like difficulty and soreness to fine-tune these suggestions in real-time.",
        icon: "🧠",
      },
      {
        title: "Ready to Get Started?",
        content: "Your journey to smarter, more effective training begins now. Let's crush your goals together!",
        icon: "🚀",
      },
    ];
  }

  static styles = [];

  _nextStep() {
    if (this.step < this.steps.length - 1) {
      this.step += 1;
    } else {
      this.dispatchEvent(new CustomEvent('onboarding-complete', { bubbles: true, composed: true }));
    }
  }

  render() {
    const currentStep = this.steps[this.step];
    const isLastStep = this.step === this.steps.length - 1;

    return html`
      <div class="onboarding-container container">
        <div class="card onboarding-card">
          <div class="onboarding-icon">${currentStep.icon}</div>
          <h2>${currentStep.title}</h2>
          <p>${currentStep.content}</p>
          <div class="onboarding-nav">
            <button class="btn-primary" @click=${this._nextStep}>
              ${isLastStep ? "Let's Go!" : "Next"}
            </button>
          </div>
          <div class="step-indicator">
            ${this.steps.map((_, i) => html`
              <span class="dot ${i === this.step ? 'active' : ''}"></span>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("onboarding-flow", OnboardingFlow);

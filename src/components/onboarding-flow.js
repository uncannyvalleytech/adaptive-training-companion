/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
// 1.A: Import Core Libraries
import { LitElement, html, css } from "lit";
// 1.B: Import Services
import { sanitizeHTML } from "../services/sanitization.js";

/*
===============================================
SECTION 2: ONBOARDING-FLOW COMPONENT DEFINITION
===============================================
*/
// 2.A: Properties
class OnboardingFlow extends LitElement {
  static properties = {
    step: { type: Number },
    userData: { type: Object },
    error: { type: String },
  };

// 2.B: Styles
  static styles = css`
    .choice-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }
  `;

// 2.C: Constructor
  constructor() {
    super();
    this.step = 0;
    this.userData = {
      age: 25,
      sex: 'male',
      training_months: 6,
      sleep_hours: 8,
      stress_level: 5,
      daysPerWeek: 4,
      goal: 'hypertrophy',
    };
    this.error = "";
    this.steps = [
      {
        title: "Welcome to Progression",
        text: "Let's gather some information to create your personalized, adaptive training plan.",
        type: "intro",
      },
      {
        title: "About You",
        text: "Tell us about your biological sex. This helps us tailor recovery and volume recommendations.",
        type: "choice-grid",
        field: "sex",
        options: [{ value: "male", text: "Male" }, { value: "female", text: "Female" }],
      },
      {
        title: "How old are you?",
        text: "Your age is a factor in recovery and programming.",
        type: "form",
        fields: [
          { key: "age", label: "Age", type: "number", min: 13, max: 99 },
        ],
      },
      {
        title: "Your Training Experience",
        text: "How many months have you been training consistently?",
        type: "form",
        fields: [{ key: "training_months", label: "Consistent Training (Months)", type: "number", min: 0, max: 240 }],
      },
      {
        title: "Lifestyle Factors",
        text: "Your recovery is influenced by sleep and stress.",
        type: "form",
        fields: [
          { key: "sleep_hours", label: "Average Sleep (Hours per night)", type: "rating", min: 4, max: 12, minLabel: "4h", maxLabel: "12h" },
          { key: "stress_level", label: "Average Daily Stress", type: "rating", min: 1, max: 10, minLabel: "Low", maxLabel: "High" },
        ],
      },
      {
        title: "Training Availability",
        text: "How many days per week can you realistically commit to training?",
        type: "choice-grid",
        field: "daysPerWeek",
        options: [{ value: 3, text: "3 Days" }, { value: 4, text: "4 Days" }, { value: 5, text: "5 Days" }, { value: 6, text: "6 Days" }],
      },
      {
        title: "What is your primary fitness goal?",
        text: "This helps us tailor your training focus.",
        type: "choice-grid",
        field: "goal",
        options: [{ value: "hypertrophy", text: "Build Muscle" }, { value: "strength", text: "Get Stronger" }, { value: "fatLoss", text: "Fat Loss" }],
      },
      {
        title: "Building Your Plan...",
        text: "We're analyzing your profile to create a personalized mesocycle just for you.",
        type: "loading",
      },
    ];
  }
===============================================
SECTION 3: EVENT HANDLERS AND LOGIC
===============================================
*/
// 3.A: Handle Input Change
  _handleInputChange(field, value) {
    // SECTION 3.1: INPUT VALIDATION & SANITIZATION
    // Enforce max value for age and sanitize input.
    let processedValue = sanitizeHTML(value);
    if (field === 'age') {
        if (Number(processedValue) > 99) {
            processedValue = 99;
        }
    }
    this.userData = { ...this.userData, [field]: processedValue };
    this.error = "";
    this.requestUpdate();
  }
  
// 3.B: Handle Choice Selection
  _handleChoiceSelection(field, value) {
    this.userData = { ...this.userData, [field]: value };
    this.requestUpdate();
  }

// 3.C: Validate Step
  _validateStep() {
    const currentStepData = this.steps[this.step];
    if (currentStepData.type === 'form') {
        for (const field of currentStepData.fields) {
            const value = this.userData[field.key];
            if (value === undefined || value === null || value === '') {
                this.error = `Please fill out the ${field.label}.`;
                return false;
            }
            if (field.type === 'number' && (value < field.min || value > field.max)) {
                this.error = `${field.label} must be between ${field.min} and ${field.max}.`;
                return false;
            }
        }
    }
    this.error = "";
    return true;
  }

// 3.D: Next Step
  _nextStep() {
    if (!this._validateStep()) return;

    if (this.step < this.steps.length - 1) {
      this.step++;
      if (this.steps[this.step].type === 'loading') {
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('onboarding-complete', {
            detail: { userData: this.userData },
            bubbles: true,
            composed: true
          }));
        }, 2500);
      }
    }
  }

// 3.E: Previous Step
  _prevStep() {
    if (this.step > 0) {
      this.step--;
      this.error = "";
    }
  }

/*
===============================================
SECTION 4: EVENT HANDLERS AND WORKOUT LOGIC
===============================================
*/
// 4.A: Handle Input Change
  _handleInputChange(field, value) {
    // SECTION 4.1: INPUT VALIDATION & SANITIZATION
    // Enforce max value for age and sanitize input.
    let processedValue = sanitizeHTML(value);
    if (field === 'age') {
        if (Number(processedValue) > 99) {
            processedValue = 99;
        }
    }
    this.userData = { ...this.userData, [field]: processedValue };
    this.error = "";
    this.requestUpdate();
  }

// 4.B: Handle Rating Change
  _handleRatingChange(field, value) {
    this.userData = { ...this.userData, [field]: Number(value) };
    this.error = "";
    this.requestUpdate();
  }
  
// 4.C: Handle Choice Selection
  _handleChoiceSelection(field, value) {
    this.userData = { ...this.userData, [field]: value };
    this.requestUpdate();
  }

// 4.D: Validate Step
  _validateStep() {
    const currentStepData = this.steps[this.step];
    if (currentStepData.type === 'form') {
        for (const field of currentStepData.fields) {
            const value = this.userData[field.key];
            if (value === undefined || value === null || value === '') {
                this.error = `Please fill out the ${field.label}.`;
                return false;
            }
            if (field.type === 'number' && (value < field.min || value > field.max)) {
                this.error = `${field.label} must be between ${field.min} and ${field.max}.`;
                return false;
            }
        }
    }
    this.error = "";
    return true;
  }

// 4.E: Next Step
  _nextStep() {
    if (!this._validateStep()) return;

    if (this.step < this.steps.length - 1) {
      this.step++;
      if (this.steps[this.step].type === 'loading') {
        setTimeout(() => {
          this.dispatchEvent(new CustomEvent('onboarding-complete', {
            detail: { userData: this.userData },
            bubbles: true,
            composed: true
          }));
        }, 2500);
      }
    }
  }

// 4.F: Previous Step
  _prevStep() {
    if (this.step > 0) {
      this.step--;
      this.error = "";
    }
  }
===============================================
SECTION 4:A RENDERING LOGIC
===============================================
*/
// 4.G: Render Step Content
  _renderStepContent(stepData) {
    switch(stepData.type) {
        case 'intro':
            return html`<button class="btn btn-primary cta-button" @click=${this._nextStep}>Get Started</button>`;
        case 'form':
            return html`
                <div class="form-inputs">
                    ${this._renderForm(stepData.fields)}
                </div>
            `;
        case 'choice':
            return html`
                <div class="card-group ${stepData.vertical ? 'vertical' : ''}">
                  ${stepData.options.map(opt => html`
                    <button class="goal-card card-interactive ${this.userData[stepData.field] == opt.value ? 'selected' : ''}" @click=${() => this._handleChoiceSelection(stepData.field, opt.value)}>
                      <h3>${opt.text}</h3>
                      ${opt.subtext ? html`<p>${opt.subtext}</p>` : ''}
                    </button>
                  `)}
                </div>
            `;
        case 'choice-grid':
            return html`
                <div class="card-group choice-grid">
                  ${stepData.options.map(opt => html`
                    <button class="goal-card card-interactive ${this.userData[stepData.field] == opt.value ? 'selected' : ''}" @click=${() => this._handleChoiceSelection(stepData.field, opt.value)}>
                      <h3>${opt.text}</h3>
                    </button>
                  `)}
                </div>
            `;
        case 'loading':
            return html`<div class="loader"></div>`;
        default:
            return html``;
    }
  }

// 4.H: Render Form
  _renderForm(fields) {
    return html`
      ${fields.map(field => {
        switch(field.type) {
          case 'number':
            return html`
              <div class="input-group">
                <label for=${field.key}>${field.label}</label>
                <input
                  type="number" id=${field.key} .value=${this.userData[field.key]}
                  @input=${e => {
                    e.stopPropagation();
                    let value = e.target.value;
                    if (value.length > 3) {
                      value = value.slice(0, 3);
                    }
                    this.userData = { ...this.userData, [field.key]: value };
                    this.requestUpdate();
                  }}
                  min=${field.min} max=${field.max} placeholder="Enter ${field.label.toLowerCase()}"
                  inputmode="numeric" pattern="[0-9]*" maxlength="3"
                />
              </div>
            `;
          case 'rating':
            return html`
              <div class="rating-group">
                <label for=${field.key}>${field.label}</label>
                <div class="rating-buttons">
                  ${Array.from({length: field.max - field.min + 1}, (_, i) => {
                    const value = field.min + i;
                    return html`
                      <button 
                        class="rating-btn ${this.userData[field.key] === value ? 'selected' : ''}"
                        @click=${() => this._handleRatingChange(field.key, value)}
                      >
                        ${value}
                      </button>
                    `;
                  })}
                </div>
                <div class="rating-labels">
                  <span>${field.minLabel || 'Low'}</span>
                  <span>${field.maxLabel || 'High'}</span>
                </div>
              </div>
            `;
          case 'choice':
              return html`
                  <div class="input-group choice-group">
                      <label>${field.label}</label>
                      <div class="button-options">
                      ${field.options.map(opt => html`
                          <button 
                              class="choice-btn ${this.userData[field.key] === opt.value ? 'selected' : ''}"
                              @click=${() => this._handleChoiceSelection(field.key, opt.value)}>
                              ${opt.text}
                          </button>
                      `)}
                      </div>
                  </div>
              `;
          default: return html``;
        }
      })}
    `;
  }
===============================================
SECTION 5: STYLES AND ELEMENT DEFINITION
===============================================
*/
// 5.A: Create Render Root
  createRenderRoot() {
    return this;
  }
}

// 5.B: Custom Element Definition
customElements.define("onboarding-flow", OnboardingFlow);

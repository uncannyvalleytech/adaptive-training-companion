import { LitElement, html } from "lit";

class OnboardingFlow extends LitElement {
  static properties = {
    step: { type: Number },
    userData: { type: Object },
    error: { type: String },
  };

  constructor() {
    super();
    this.step = 0;
    this.userData = {
      // Default values
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
        text: "This information helps us calculate your baseline recovery capacity.",
        type: "form",
        fields: [
          {
            key: "sex",
            label: "Biological Sex",
            type: "choice",
            options: [
              { value: "male", text: "Male" },
              { value: "female", text: "Female" },
            ],
          },
          {
            key: "age",
            label: "Age",
            type: "number",
            min: 13,
            max: 99,
          },
        ],
      },
      {
        title: "Your Training Experience",
        text: "How many months have you been training consistently?",
        type: "form",
        fields: [
          {
            key: "training_months",
            label: "Consistent Training (Months)",
            type: "number",
            min: 0,
            max: 240,
          },
        ],
      },
      {
        title: "Lifestyle Factors",
        text: "Your recovery is influenced by sleep and stress.",
        type: "form",
        fields: [
          {
            key: "sleep_hours",
            label: "Average Sleep (Hours per night)",
            type: "slider",
            min: 4,
            max: 12,
            step: 0.5,
          },
          {
            key: "stress_level",
            label: "Average Daily Stress (1-10)",
            type: "slider",
            min: 1,
            max: 10,
            step: 1,
          },
        ],
      },
      {
        title: "Training Availability",
        text: "How many days per week can you realistically commit to training?",
        type: "choice",
        field: "daysPerWeek",
        options: [
          { value: "3", text: "3 Days" },
          { value: "4", text: "4 Days" },
          { value: "5", text: "5 Days" },
          { value: "6", text: "6 Days" },
        ],
      },
      {
        title: "What is your primary fitness goal?",
        text: "This helps us tailor your training focus.",
        type: "choice",
        field: "goal",
        options: [
          { value: "hypertrophy", text: "Build Muscle" },
          { value: "strength", text: "Get Stronger" },
          { value: "fatLoss", text: "Fat Loss" },
        ],
      },
      {
        title: "Building Your Plan...",
        text: "We're analyzing your profile to create a personalized mesocycle just for you.",
        type: "loading",
      },
    ];
  }

  _handleInputChange(field, value) {
    this.userData = { ...this.userData, [field]: value };
    this.error = ""; // Clear error on input
  }
  
  _handleChoiceSelection(field, value) {
    this.userData = { ...this.userData, [field]: value };
    this._nextStep(); // Move to next step automatically on choice selection
  }

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

  _nextStep() {
    if (!this._validateStep()) {
        return;
    }

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

  _prevStep() {
    if (this.step > 0) {
      this.step--;
      this.error = "";
    }
  }

  render() {
    const currentStepData = this.steps[this.step];
    const progress = (this.step / (this.steps.length - 2)) * 100;

    return html`
      <div class="onboarding-container">
        <div class="onboarding-wizard">
          ${currentStepData.type !== 'intro' && currentStepData.type !== 'loading' ? html`
            <div class="progress-bar">
              <div class="progress" style="width: ${progress}%"></div>
            </div>
          ` : ''}

          <div class="step active">
            <h2>${currentStepData.title}</h2>
            <p>${currentStepData.text}</p>
            
            ${this.error ? html`<p class="error-message">${this.error}</p>` : ''}

            ${this._renderStepContent(currentStepData)}

            <div class="button-group">
              ${this.step > 0 && currentStepData.type !== 'loading' ? html`
                <button class="secondary-button" @click=${this._prevStep}>Back</button>
              ` : ''}
              ${currentStepData.type === 'form' ? html`
                <button class="cta-button" @click=${this._nextStep}>Next</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderStepContent(stepData) {
    switch(stepData.type) {
        case 'intro':
            return html`<button class="cta-button" @click=${this._nextStep}>Get Started</button>`;
        case 'form':
            return this._renderForm(stepData.fields);
        case 'choice':
            return this._renderChoice(stepData);
        case 'loading':
            return html`<div class="loader"></div>`; // Add a CSS loader animation
        default:
            return html``;
    }
  }

  _renderForm(fields) {
    return html`
      <div class="form-inputs">
        ${fields.map(field => {
          switch(field.type) {
            case 'number':
              return html`
                <div class="input-group">
                  <label for=${field.key}>${field.label}</label>
                  <input
                    type="number"
                    id=${field.key}
                    .value=${this.userData[field.key]}
                    @input=${e => this._handleInputChange(field.key, Number(e.target.value))}
                    min=${field.min}
                    max=${field.max}
                    placeholder="Enter ${field.label.toLowerCase()}"
                  />
                </div>
              `;
            case 'slider':
              return html`
                <div class="input-group slider-group">
                  <label for=${field.key}>${field.label}: <strong>${this.userData[field.key]}</strong></label>
                  <input
                    type="range"
                    id=${field.key}
                    .value=${this.userData[field.key]}
                    @input=${e => this._handleInputChange(field.key, Number(e.target.value))}
                    min=${field.min}
                    max=${field.max}
                    step=${field.step}
                  />
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
                                @click=${() => this._handleInputChange(field.key, opt.value)}>
                                ${opt.text}
                            </button>
                        `)}
                        </div>
                    </div>
                `;
            default:
              return html``;
          }
        })}
      </div>
    `;
  }

  _renderChoice(stepData) {
    return html`
      <div class="card-group ${stepData.vertical ? 'vertical' : ''}">
        ${stepData.options.map(opt => html`
          <div class="goal-card" @click=${() => this._handleChoiceSelection(stepData.field, opt.value)}>
            <h3>${opt.text}</h3>
            ${opt.subtext ? html`<p>${opt.subtext}</p>` : ''}
          </div>
        `)}
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("onboarding-flow", OnboardingFlow);

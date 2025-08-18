import { LitElement, html } from "lit";

class OnboardingFlow extends LitElement {
  static properties = {
    step: { type: Number },
    userData: { type: Object },
  };

  constructor() {
    super();
    this.step = 0;
    this.userData = {};
    this.steps = [
      {
        title: "Welcome to Progression",
        text: "Let's build your perfect workout plan. First, tell us a little about yourself.",
        type: "intro",
      },
      {
        title: "What is your primary fitness goal?",
        text: "This helps us tailor your training volume and intensity.",
        type: "choice",
        field: "goal",
        options: [
          { value: "hypertrophy", text: "Build Muscle" },
          { value: "strength", text: "Get Stronger" },
          { value: "fatLoss", text: "Fat Loss" },
        ],
      },
      {
        title: "What is your training age?",
        text: "Be honest! This determines your starting volume and progression rate.",
        type: "choice",
        field: "trainingAge",
        vertical: true,
        options: [
          { value: "novice", text: "Novice", subtext: "< 6 months of consistent training" },
          { value: "beginner", text: "Beginner", subtext: "6 months to 2 years of training" },
          { value: "intermediate", text: "Intermediate", subtext: "2 to 5 years of serious training" },
          { value: "advanced", text: "Advanced", subtext: "5+ years of dedicated training" },
        ],
      },
      {
        title: "How many days per week can you train?",
        text: "We'll use this to create an optimal training split for you.",
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
        title: "What is your current dietary status?",
        text: "Your nutrition impacts recovery and how much training volume you can handle.",
        type: "choice",
        field: "dietaryStatus",
        vertical: true,
        options: [
          { value: "surplus", text: "Calorie Surplus", subtext: "Actively trying to gain weight" },
          { value: "maintenance", text: "Maintenance", subtext: "Maintaining current weight" },
          { value: "deficit", text: "Calorie Deficit", subtext: "Actively trying to lose weight" },
        ],
      },
      {
        title: "Where do you prefer to work out?",
        text: "No gym? No problem. We'll build workouts you can do anywhere.",
        type: "choice",
        field: "style",
        options: [
          { value: "gym", text: "Gym" },
          { value: "home", text: "Home" },
        ],
      },
      {
        title: "Building Your Plan...",
        text: "We're analyzing your profile to create a personalized mesocycle just for you.",
        type: "loading",
      },
    ];
  }

  _handleSelection(field, value) {
    this.userData = { ...this.userData, [field]: value };
    
    if (this.step < this.steps.length - 1) {
        if (this.steps[this.step + 1].type === 'loading') {
            this.step++;
            setTimeout(() => {
                this.dispatchEvent(new CustomEvent('onboarding-complete', { 
                    detail: { userData: this.userData },
                    bubbles: true, 
                    composed: true 
                }));
            }, 2000);
        } else {
            this.step++;
        }
    }
  }

  _nextStep() {
    if (this.step < this.steps.length - 1) {
      this.step++;
    }
  }

  _prevStep() {
    if (this.step > 0) {
      this.step--;
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
            
            ${currentStepData.type === 'intro' ? html`
              <button class="cta-button" @click=${this._nextStep}>Get Started</button>
            ` : ''}

            ${currentStepData.type === 'choice' ? html`
              <div class="card-group ${currentStepData.vertical ? 'vertical' : ''}">
                ${currentStepData.options.map(opt => html`
                  <div class="goal-card" @click=${() => this._handleSelection(currentStepData.field, opt.value)}>
                    <h3>${opt.text}</h3>
                    ${opt.subtext ? html`<p>${opt.subtext}</p>` : ''}
                  </div>
                `)}
              </div>
            ` : ''}

            <div class="button-group">
              ${this.step > 0 && currentStepData.type !== 'loading' ? html`
                <button class="secondary-button" @click=${this._prevStep}>Back</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Since we are not using a shadow DOM, we need to create the render root
  createRenderRoot() {
    return this;
  }
}

customElements.define("onboarding-flow", OnboardingFlow);

/**
 * @file motivational-elements.js
 * Reusable components for gamification and motivation
 */

import { LitElement, html } from "lit";

// Daily Challenge Card Component
class DailyChallengeCard extends LitElement {
  static properties = {
    challenge: { type: Object },
    progress: { type: Number },
  };

  constructor() {
    super();
    this.challenge = {};
    this.progress = 0;
  }

  render() {
    const { title, description, reward, total } = this.challenge;
    const progressPercent = (this.progress / total) * 100;

    return html`
      <div class="challenge-card card">
        <div class="challenge-header">
          <div class="challenge-icon">💪</div>
          <div class="challenge-reward">+${reward} XP</div>
        </div>
        <div class="challenge-title">${title}</div>
        <div class="challenge-description">${description}</div>
        <div class="challenge-progress">
          <div class="challenge-progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="challenge-progress-text">${this.progress}/${total} completed</div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Motivational Quote Component
class MotivationalQuote extends LitElement {
  static properties = {
    quote: { type: String },
    author: { type: String },
  };

  constructor() {
    super();
    this.quote = "";
    this.author = "";
    this._quotes = [
      { text: "The groundwork for all happiness is good health.", author: "Leigh Hunt" },
      { text: "Strength does not come from physical capacity. It comes from an indomitable will.", author: "Mahatma Gandhi" },
      { text: "The first wealth is health.", author: "Ralph Waldo Emerson" },
      { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
      { text: "What seems impossible today will one day become your warm-up.", author: "Unknown" },
    ];
  }

  connectedCallback() {
    super.connectedCallback();
    this._selectRandomQuote();
  }

  _selectRandomQuote() {
    const randomQuote = this._quotes[Math.floor(Math.random() * this._quotes.length)];
    this.quote = randomQuote.text;
    this.author = randomQuote.author;
  }

  render() {
    return html`
      <div class="quote-card card">
        <div class="quote-text">${this.quote}</div>
        <div class="quote-author">— ${this.author}</div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Achievement Badge Component
class AchievementBadge extends LitElement {
  static properties = {
    achievement: { type: Object },
    unlocked: { type: Boolean },
  };

  constructor() {
    super();
    this.achievement = {};
    this.unlocked = false;
  }

  render() {
    const { name, description, icon } = this.achievement;

    return html`
      <div class="achievement-card card ${this.unlocked ? 'unlocked' : 'locked'}">
        <span class="achievement-icon">${this.unlocked ? icon : '🔒'}</span>
        <div class="achievement-content">
          <h4>${name}</h4>
          <p>${description}</p>
        </div>
        ${this.unlocked ? html`
          <div class="achievement-unlocked">✓ Unlocked</div>
        ` : ''}
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Progress Ring Component (Enhanced)
class ProgressRing extends LitElement {
  static properties = {
    radius: { type: Number },
    stroke: { type: Number },
    progress: { type: Number },
    color: { type: String },
    showValue: { type: Boolean },
    value: { type: String },
  };

  constructor() {
    super();
    this.radius = 40;
    this.stroke = 8;
    this.progress = 0;
    this.color = 'var(--gradient-success)';
    this.showValue = false;
    this.value = '';
  }

  render() {
    const normalizedRadius = this.radius - this.stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (this.progress / 100) * circumference;

    return html`
      <div class="progress-ring-container" style="position: relative; display: inline-block;">
        <svg
          height=${this.radius * 2}
          width=${this.radius * 2}
          class="progress-ring"
        >
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#00D4FF"/>
              <stop offset="100%" style="stop-color:#00FF88"/>
            </linearGradient>
          </defs>
          <circle
            class="progress-ring__background"
            stroke="rgba(255, 255, 255, 0.1)"
            stroke-width=${this.stroke}
            fill="transparent"
            r=${normalizedRadius}
            cx=${this.radius}
            cy=${this.radius}
          />
          <circle
            class="progress-ring__progress"
            stroke="url(#progressGradient)"
            stroke-width=${this.stroke}
            stroke-dasharray=${circumference + ' ' + circumference}
            style="stroke-dashoffset:${strokeDashoffset}"
            fill="transparent"
            r=${normalizedRadius}
            cx=${this.radius}
            cy=${this.radius}
          />
        </svg>
        ${this.showValue ? html`
          <div class="progress-ring-value" style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: var(--font-display);
            font-weight: 700;
            color: white;
            font-size: ${this.radius / 3}px;
          ">${this.value}</div>
        ` : ''}
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Workout Streak Display
class WorkoutStreak extends LitElement {
  static properties = {
    streak: { type: Number },
    size: { type: String },
  };

  constructor() {
    super();
    this.streak = 0;
    this.size = 'medium'; // small, medium, large
  }

  render() {
    const sizeClasses = {
      small: 'streak-small',
      medium: 'streak-medium', 
      large: 'streak-large'
    };

    return html`
      <div class="streak-container ${sizeClasses[this.size]} card">
        <div class="streak-flame">🔥</div>
        <div class="streak-count">${this.streak}</div>
        <div class="streak-label">${this.streak === 1 ? 'Day' : 'Days'} Streak</div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Level Progress Component
class LevelProgress extends LitElement {
  static properties = {
    currentLevel: { type: Number },
    currentXP: { type: Number },
    xpToNext: { type: Number },
    levelTitle: { type: String },
  };

  constructor() {
    super();
    this.currentLevel = 1;
    this.currentXP = 0;
    this.xpToNext = 1000;
    this.levelTitle = 'Fitness Novice';
  }

  getLevelTitle(level) {
    const titles = {
      1: 'Fitness Novice',
      2: 'Training Apprentice',
      3: 'Gym Regular',
      4: 'Strength Seeker',
      5: 'Fitness Enthusiast',
      6: 'Training Warrior',
      7: 'Muscle Builder',
      8: 'Strength Master',
      9: 'Fitness Legend',
      10: 'Iron Champion'
    };
    return titles[level] || `Level ${level} Master`;
  }

  render() {
    const progressPercent = ((this.currentXP % 1000) / 1000) * 100;
    const title = this.getLevelTitle(this.currentLevel);

    return html`
      <div class="level-system card">
        <div class="level-header">
          <div class="level-badge">
            <div class="level-icon">⚡</div>
            <div class="level-info">
              <h3>${title}</h3>
              <p>Level ${this.currentLevel}</p>
            </div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <div class="progress-text">${this.currentXP % 1000} / ${this.xpToNext} XP to next level</div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Motivational Messages Component
class MotivationalMessage extends LitElement {
  static properties = {
    message: { type: String },
    type: { type: String },
    icon: { type: String },
  };

  constructor() {
    super();
    this.message = '';
    this.type = 'encouragement'; // encouragement, achievement, progress, challenge
    this.icon = '💪';
    this._messages = {
      encouragement: [
        { text: "You're crushing it! Keep going!", icon: '💪' },
        { text: "Every rep counts! You've got this!", icon: '🔥' },
        { text: "Strong work! Your future self will thank you!", icon: '⚡' },
        { text: "Progress over perfection - you're doing amazing!", icon: '🎯' }
      ],
      achievement: [
        { text: "New personal record! You're unstoppable!", icon: '🏆' },
        { text: "Achievement unlocked! Keep reaching new heights!", icon: '🎖️' },
        { text: "You just leveled up! Incredible work!", icon: '⭐' }
      ],
      progress: [
        { text: "Look how far you've come! The gains are real!", icon: '📈' },
        { text: "Your consistency is paying off!", icon: '📊' },
        { text: "Progress alert: You're getting stronger every day!", icon: '💯' }
      ],
      challenge: [
        { text: "Challenge accepted! Time to push your limits!", icon: '🎯' },
        { text: "New challenge unlocked! Ready to level up?", icon: '🚀' },
        { text: "Your next challenge awaits - let's do this!", icon: '⚡' }
      ]
    };
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.message) {
      this._selectRandomMessage();
    }
  }

  _selectRandomMessage() {
    const messages = this._messages[this.type] || this._messages.encouragement;
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    this.message = randomMessage.text;
    this.icon = randomMessage.icon;
  }

  render() {
    return html`
      <div class="motivational-message card">
        <div class="message-icon">${this.icon}</div>
        <p class="message-text">${this.message}</p>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

// Export all components
customElements.define('daily-challenge-card', DailyChallengeCard);
customElements.define('motivational-quote', MotivationalQuote);
customElements.define('achievement-badge', AchievementBadge);
customElements.define('progress-ring', ProgressRing);
customElements.define('workout-streak', WorkoutStreak);
customElements.define('level-progress', LevelProgress);
customElements.define('motivational-message', MotivationalMessage);

export {
  DailyChallengeCard,
  MotivationalQuote,
  AchievementBadge,
  ProgressRing,
  WorkoutStreak,
  LevelProgress,
  MotivationalMessage
};

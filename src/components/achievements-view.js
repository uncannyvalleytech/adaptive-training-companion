import { LitElement, html } from "lit";

class AchievementsView extends LitElement {
  static properties = {
    unlockedAchievements: { type: Array },
    currentStreak: { type: Number },
  };

  constructor() {
    super();
    // This would typically be fetched from user data
    this.unlockedAchievements = ['first_workout', 'five_workouts']; 
    this.currentStreak = 5;
    this.allAchievements = [
      { id: 'first_workout', name: 'First Workout!', description: 'Complete your first workout.', icon: '･' },
      { id: 'five_workouts', name: 'Workout Warrior', description: 'Complete 5 workouts.', icon: '潮' },
      { id: 'ten_workouts', name: 'Dedicated Lifter', description: 'Complete 10 workouts.', icon: '暑ｸ' },
      { id: 'seven_day_streak', name: '7-Day Streak', description: 'Log a workout for 7 consecutive days.', icon: '櫨' },
    ];
  }

  render() {
    const lockedAchievements = this.allAchievements.filter(
      (achievement) => !this.unlockedAchievements.includes(achievement.id)
    );

    return html`
      <div class="achievements-container container">
        <header class="app-header">
          <button class="btn btn-icon" @click=${() => this.dispatchEvent(new CustomEvent('setView', { detail: { view: 'home' }, bubbles: true, composed: true }))} aria-label="Back">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <h1>Achievements</h1>
          <div style="width: 48px;"></div>
        </header>
        <div class="card streak-card">
          <div class="streak-icon">
            <span>櫨</span>
          </div>
          <div class="streak-text">
            <h3>Current Streak</h3>
            <p>${this.currentStreak} day(s)</p>
          </div>
        </div>

        <h2 class="section-title">Unlocked Achievements</h2>
        <div class="achievements-list">
          ${this.unlockedAchievements.length === 0
            ? html`<p class="no-data">You haven't unlocked any achievements yet. Keep training!</p>`
            : this.allAchievements
                .filter(a => this.unlockedAchievements.includes(a.id))
                .map(
                  (achievement) => html`
                    <div class="card achievement-card unlocked slide-in">
                      <span class="achievement-icon">${achievement.icon}</span>
                      <div class="achievement-content">
                        <h4>${achievement.name}</h4>
                        <p>${achievement.description}</p>
                      </div>
                    </div>
                  `
                )}
        </div>

        <h2 class="section-title">Locked Achievements</h2>
        <div class="achievements-list">
          ${lockedAchievements.length === 0
            ? html`<p class="no-data">All achievements unlocked! Amazing work.</p>`
            : lockedAchievements.map(
                (achievement) => html`
                  <div class="card achievement-card locked">
                    <span class="achievement-icon">白</span>
                    <div class="achievement-content">
                      <h4>${achievement.name}</h4>
                      <p>${achievement.description}</p>
                    </div>
                  </div>
                `
              )}
        </div>
      </div>
    `;
  }

  createRenderRoot() {
      return this;
  }
}

customElements.define("achievements-view", AchievementsView);

/**
 * @file achievements-view.js
 * This component displays the user's workout streak and a list of
 * unlocked and locked achievements.
 */

import { LitElement, html } from "lit";

class AchievementsView extends LitElement {
  static properties = {
    unlockedAchievements: { type: Array },
    currentStreak: { type: Number },
  };

  constructor() {
    super();
    this.unlockedAchievements = [];
    this.currentStreak = 0;
    this.allAchievements = [
      { id: 'first_workout', name: 'First Workout!', description: 'Complete your first workout.', icon: '💪' },
      { id: 'five_workouts', name: 'Workout Warrior', description: 'Complete 5 workouts.', icon: '🏋️' },
      { id: 'ten_workouts', name: 'Dedicated Lifter', description: 'Complete 10 workouts.', icon: '🥇' },
      { id: 'seven_day_streak', name: '7-Day Streak', description: 'Log a workout for 7 consecutive days.', icon: '🔥' },
      // Add more achievements here as needed
    ];
  }

  static styles = [];

  render() {
    const lockedAchievements = this.allAchievements.filter(
      (achievement) => !this.unlockedAchievements.includes(achievement.id)
    );

    return html`
      <div class="achievements-container container">
        <header class="app-header">
          <h1>Achievements</h1>
        </header>

        <div class="card streak-card">
          <div class="streak-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"></path><path d="M12 6v6l4 2"></path></svg>
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
                    <div class="card achievement-card unlocked">
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
                    <span class="achievement-icon">🔒</span>
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
}

customElements.define("achievements-view", AchievementsView);

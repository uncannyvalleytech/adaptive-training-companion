/**
 * @file settings-view.js
 * This component handles the user settings and customization options,
 * such as theme and unit preferences.
 */

import { LitElement, html } from "lit";

class SettingsView extends LitElement {
  static properties = {
    theme: { type: String },
    units: { type: String },
  };

  constructor() {
    super();
    this.theme = localStorage.getItem('theme') || 'dark';
    this.units = localStorage.getItem('units') || 'lbs';
  }

  static styles = []; // Styles will be handled by the global stylesheet

  _handleThemeChange(e) {
    this.theme = e.target.value;
    localStorage.setItem('theme', this.theme);
    this.dispatchEvent(new CustomEvent('theme-change', {
      detail: { theme: this.theme },
      bubbles: true,
      composed: true
    }));
  }

  _handleUnitsChange(e) {
    this.units = e.target.value;
    localStorage.setItem('units', this.units);
    this.dispatchEvent(new CustomEvent('units-change', {
      detail: { units: this.units },
      bubbles: true,
      composed: true
    }));
  }

  render() {
    return html`
      <div class="settings-container container">
        <header class="app-header">
          <h1>Settings</h1>
        </header>
        <div class="card settings-group">
          <h3>Appearance</h3>
          <div class="setting-item">
            <label for="theme-select">Theme:</label>
            <select id="theme-select" @change=${this._handleThemeChange}>
              <option value="dark" ?selected=${this.theme === 'dark'}>Dark</option>
              <option value="light" ?selected=${this.theme === 'light'}>Light</option>
            </select>
          </div>
        </div>

        <div class="card settings-group">
          <h3>Workout Preferences</h3>
          <div class="setting-item">
            <label for="units-select">Units:</label>
            <select id="units-select" @change=${this._handleUnitsChange}>
              <option value="lbs" ?selected=${this.units === 'lbs'}>Pounds (lbs)</option>
              <option value="kg" ?selected=${this.units === 'kg'}>Kilograms (kg)</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define("settings-view", SettingsView);

/**
 * @file settings-view.js
 * This component handles the user settings and customization options,
 * such as theme, units, data management, and account actions.
 */

import { LitElement, html } from "lit";

class SettingsView extends LitElement {
  static properties = {
    theme: { type: String },
    units: { type: String },
    showDeleteConfirm: { type: Boolean },
  };

  constructor() {
    super();
    this.theme = localStorage.getItem('theme') || 'dark';
    this.units = localStorage.getItem('units') || 'lbs';
    this.showDeleteConfirm = false;
  }

  _dispatchEvent(eventName, detail = {}) {
    this.dispatchEvent(new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    }));
  }

  _handleThemeChange(newTheme) {
    this.theme = newTheme;
    localStorage.setItem('theme', this.theme);
    this._dispatchEvent('theme-change', { theme: this.theme });
  }

  _handleUnitsChange(newUnits) {
    this.units = newUnits;
    localStorage.setItem('units', this.units);
    this._dispatchEvent('units-change', { units: this.units });
  }
  
  _handleSignOut() {
    this._dispatchEvent('sign-out');
  }
  
  _handleDeleteData() {
    this._dispatchEvent('delete-data');
    this.showDeleteConfirm = false;
  }

  render() {
    return html`
      <div class="settings-container container">
        <header class="app-header">
          <button class="back-btn" @click=${() => this._dispatchEvent('setView', { view: 'home' })} aria-label="Back to Home">
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
          </button>
          <h1>Settings</h1>
        </header>

        <div class="card settings-group">
          <h3>Appearance</h3>
          <div class="setting-item">
            <label>Theme</label>
            <div class="button-toggle-group">
              <button class="toggle-btn ${this.theme === 'dark' ? 'active' : ''}" @click=${() => this._handleThemeChange('dark')}>Dark</button>
              <button class="toggle-btn ${this.theme === 'light' ? 'active' : ''}" @click=${() => this._handleThemeChange('light')}>Light</button>
            </div>
          </div>
        </div>

        <div class="card settings-group">
          <h3>Workout Preferences</h3>
          <div class="setting-item">
            <label>Units</label>
            <div class="button-toggle-group">
              <button class="toggle-btn ${this.units === 'lbs' ? 'active' : ''}" @click=${() => this._handleUnitsChange('lbs')}>Pounds (lbs)</button>
              <button class="toggle-btn ${this.units === 'kg' ? 'active' : ''}" @click=${() => this._handleUnitsChange('kg')}>Kilograms (kg)</button>
            </div>
          </div>
        </div>
        
        <div class="card settings-group danger-zone">
          <h3>Data Management</h3>
          <p>Warning: These actions cannot be undone.</p>
          <button class="btn-danger" @click=${() => this.showDeleteConfirm = true}>Delete All My Data</button>
        </div>
        
        <div class="card settings-group">
            <h3>Account</h3>
            <button class="btn-secondary" @click=${this._handleSignOut}>Sign Out</button>
        </div>

        ${this.showDeleteConfirm ? this.renderDeleteConfirmModal() : ''}
      </div>
    `;
  }

  renderDeleteConfirmModal() {
    return html`
      <div class="modal-overlay" @click=${() => this.showDeleteConfirm = false}>
        <div class="modal-content card" @click=${e => e.stopPropagation()}>
          <h3>Are you sure?</h3>
          <p>This will permanently delete all your workout history and user data. This action cannot be undone.</p>
          <div class="button-group">
            <button class="btn-danger" @click=${this._handleDeleteData}>Yes, Delete Everything</button>
            <button class="btn-secondary" @click=${() => this.showDeleteConfirm = false}>Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  createRenderRoot() {
    return this;
  }
}

customElements.define("settings-view", SettingsView);

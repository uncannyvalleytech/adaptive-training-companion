// src/components/settings-view.js

/**
 * @file settings-view.js
 * This component handles the user settings and customization options,
 * such as theme, units, data management, and account actions.
 */

import { LitElement, html } from "lit";
import { getDataLocally } from "../services/local-storage.js";

class SettingsView extends LitElement {
  static properties = {
    theme: { type: String },
    units: { type: String },
    showDeleteConfirm: { type: Boolean },
    userData: { type: Object },
  };

  constructor() {
    super();
    this.theme = localStorage.getItem('theme') || 'dark';
    this.units = localStorage.getItem('units') || 'lbs';
    this.showDeleteConfirm = false;
    this.userData = getDataLocally();
  }

  // Helper to dispatch events up to the app-shell
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
    this.requestUpdate();
  }

  _handleUnitsChange(newUnits) {
    this.units = newUnits;
    localStorage.setItem('units', this.units);
    this._dispatchEvent('units-change', { units: this.units });
    this.requestUpdate();
  }
  
  _handleSignOut() {
    this._dispatchEvent('sign-out');
  }
  
  _handleDeleteData() {
    this._dispatchEvent('delete-data');
    this.showDeleteConfirm = false;
  }

  _handleEditRoutine(routineId) {
    this._dispatchEvent('edit-routine', { routineId });
  }

  _handleDeleteRoutine(routineId) {
    this._dispatchEvent('delete-routine', { routineId });
    this.userData = getDataLocally();
    this.requestUpdate();
  }

  render() {
    const customRoutines = this.userData.templates.filter(t => t.primaryFocus === 'custom');

    return html`
      <div class="settings-container container">
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

        <div class="card settings-group">
            <h3>Routine</h3>
            <div class="setting-item">
                <label>Active Mesocycle</label>
                <span>${this.userData.activeProgram ? this.userData.activeProgram.name : 'None'}</span>
            </div>
            <div class="divider"></div>
            <label>Your Custom Routines</label>
            ${customRoutines.length > 0 ? customRoutines.map(routine => html`
                <div class="routine-management-item">
                    <span>${routine.name}</span>
                    <div class="routine-actions">
                        <button class="btn-icon" @click=${() => this._handleEditRoutine(routine.id)}>✏️</button>
                        <button class="btn-icon btn-danger" @click=${() => this._handleDeleteRoutine(routine.id)}>🗑️</button>
                    </div>
                </div>
            `) : html`<p>No custom routines created yet.</p>`}
        </div>
        
        <div class="card settings-group danger-zone">
          <h3>Data Management</h3>
          <p>Warning: These actions cannot be undone.</p>
          <button class="btn-danger" @click=${() => this.showDeleteConfirm = true}>Delete All My Data</button>
        </div>
        
        <div class="card settings-group">
          <h3>Account</h3>
          <div class="setting-item">
            <div style="flex: 1;">
              <label>Google Sync</label>
              <p style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: var(--space-1) 0 0 0;">
                Sync your data across devices with Google account
              </p>
            </div>
            <button class="btn btn-secondary" disabled style="opacity: 0.6; cursor: not-allowed;">
              Coming Soon
            </button>
          </div>
          <button class="btn btn-ghost" @click=${this._handleSignOut}>Reset App</button>
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

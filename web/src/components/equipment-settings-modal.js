/*
===============================================
SECTION 1: COMPONENT AND SERVICE IMPORTS
===============================================
*/
import { LitElement, html, css } from "lit";
import { saveDataLocally, getDataLocally } from "../services/local-storage.js";
import { exerciseDatabase } from "../services/exercise-database.js";

/*
===============================================
SECTION 2: EQUIPMENT-SETTINGS-MODAL COMPONENT
===============================================
*/
class EquipmentSettingsModal extends LitElement {
  static properties = {
    availableEquipment: { type: Array },
    allEquipmentOptions: { type: Array },
    onClose: { type: Function },
  };

  constructor() {
    super();
    this.allEquipmentOptions = this._getAllEquipmentOptions();
    this.availableEquipment = getDataLocally()?.availableEquipment || this.allEquipmentOptions;
  }

  _getAllEquipmentOptions() {
    const equipmentSet = new Set();
    Object.values(exerciseDatabase).flat().forEach(ex => {
        ex.equipment.forEach(eq => equipmentSet.add(eq));
    });
    return Array.from(equipmentSet).sort();
  }

  _handleToggle(equipment) {
    if (this.availableEquipment.includes(equipment)) {
      this.availableEquipment = this.availableEquipment.filter(e => e !== equipment);
    } else {
      this.availableEquipment = [...this.availableEquipment, equipment];
    }
  }

  _handleSave() {
    saveDataLocally({ availableEquipment: this.availableEquipment });
    this.dispatchEvent(new CustomEvent('equipment-updated', { bubbles: true, composed: true }));
    if (this.onClose) {
      this.onClose();
    }
  }

  _handleOverlayClick(e) {
    if (e.target === e.currentTarget && this.onClose) {
      this.onClose();
    }
  }

/*
===============================================
SECTION 3: RENDERING LOGIC
===============================================
*/
  render() {
    return html`
      <div class="modal-overlay" @click=${this._handleOverlayClick}>
        <div class="modal-content card" @click=${e => e.stopPropagation()}>
          <div class="modal-header">
            <h2 id="modal-title">Your Equipment</h2>
            <button class="close-button" @click=${this.onClose} aria-label="Close modal">✖</button>
          </div>
          <p class="modal-subtitle">Select the equipment you have available. This will help us suggest better exercise substitutions.</p>
          
          <div class="equipment-grid">
            ${this.allEquipmentOptions.map(equipment => html`
              <div 
                class="equipment-item ${this.availableEquipment.includes(equipment) ? 'selected' : ''}"
                @click=${() => this._handleToggle(equipment)}
              >
                ${equipment.replace('_', ' ')}
              </div>
            `)}
          </div>

          <div class="button-group">
            <button class="secondary-button" @click=${this.onClose}>Cancel</button>
            <button class="cta-button" @click=${this._handleSave}>Save Equipment</button>
          </div>
        </div>
      </div>
    `;
  }

/*
===============================================
SECTION 4: STYLES AND ELEMENT DEFINITION
===============================================
*/
  static styles = css`
    .equipment-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: var(--space-3);
      margin-bottom: var(--space-6);
    }
    .equipment-item {
      background: var(--color-surface-tertiary);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      text-align: center;
      cursor: pointer;
      transition: all 0.2s ease-in-out;
      font-weight: 500;
      text-transform: capitalize;
    }
    .equipment-item:hover {
      transform: translateY(-2px);
      border-color: var(--color-accent-primary);
    }
    .equipment-item.selected {
      background: var(--color-accent-primary);
      color: var(--color-surface-primary);
      border-color: var(--color-accent-primary);
      font-weight: 600;
    }
    .button-group {
      display: flex;
      gap: var(--space-4);
      justify-content: flex-end;
    }
  `;

  createRenderRoot() {
    return this;
  }
}

customElements.define("equipment-settings-modal", EquipmentSettingsModal);

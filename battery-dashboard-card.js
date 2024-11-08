class BatteryDashboardCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      // Création de la structure de base
      this.innerHTML = `
        <ha-card>
          <div class="card-content">
            <style>
              .battery-dashboard {
                padding: 16px;
              }
              .battery-section {
                margin-bottom: 24px;
              }
              .device-card {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: var(--card-background-color);
                border-radius: 8px;
                margin-bottom: 8px;
              }
              .battery-level {
                font-weight: bold;
              }
              .battery-critical {
                color: var(--error-color);
              }
              .battery-warning {
                color: var(--warning-color);
              }
              .battery-normal {
                color: var(--success-color);
              }
              .section-title {
                font-size: 18px;
                font-weight: bold;
                margin-bottom: 16px;
              }
            </style>
            <div class="battery-dashboard"></div>
          </div>
        </ha-card>
      `;
      this.content = this.querySelector('.battery-dashboard');
    }

    const config = this._config;
    if (!config.entities) return;

    // Grouper les entités par catégorie
    const categories = {
      vehicles: [],
      apple_phones: [],
      apple_tablets: [],
      aqara_buttons: [],
      aqara_doors: [],
      aqara_motion: [],
      aqara_temperature: [],
      aqara_thermostats: []
    };

    config.entities.forEach(entity => {
      const state = hass.states[entity.entity];
      if (state) {
        categories[entity.category].push({
          name: entity.name || state.attributes.friendly_name,
          level: state.state,
          entity_id: entity.entity
        });
      }
    });

    // Créer le contenu HTML
    let html = '';

    // Fonction pour obtenir la classe de couleur selon le niveau de batterie
    const getBatteryClass = (level) => {
      level = parseFloat(level);
      if (level <= 20) return 'battery-critical';
      if (level <= 40) return 'battery-warning';
      return 'battery-normal';
    };

    // Afficher les appareils à batterie faible
    const lowBatteryDevices = config.entities
      .filter(entity => {
        const state = hass.states[entity.entity];
        return state && parseFloat(state.state) <= 20;
      });

    if (lowBatteryDevices.length > 0) {
      html += `
        <div class="battery-section">
          <div class="section-title battery-critical">⚠️ Batteries faibles</div>
          ${lowBatteryDevices.map(entity => `
            <div class="device-card">
              <div>${entity.name}</div>
              <div class="battery-level battery-critical">
                ${hass.states[entity.entity].state}%
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }

    // Générer les sections pour chaque catégorie
    const categoryTitles = {
      vehicles: '🚗 Véhicules',
      apple_phones: '📱 iPhones',
      apple_tablets: '📱 iPads',
      aqara_buttons: '🔘 Boutons',
      aqara_doors: '🚪 Portes/Fenêtres',
      aqara_motion: '📡 Mouvement',
      aqara_temperature: '🌡️ Température',
      aqara_thermostats: '🎛️ Thermostats'
    };

    Object.entries(categories).forEach(([category, devices]) => {
      if (devices.length > 0) {
        html += `
          <div class="battery-section">
            <div class="section-title">${categoryTitles[category]}</div>
            ${devices.map(device => `
              <div class="device-card">
                <div>${device.name}</div>
                <div class="battery-level ${getBatteryClass(device.level)}">
                  ${device.level}%
                </div>
              </div>
            `).join('')}
          </div>
        `;
      }
    });

    this.content.innerHTML = html;
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error('Vous devez définir les entités');
    }
    this._config = config;
  }

  getCardSize() {
    return 3;
  }

  static getConfigElement() {
    return document.createElement('battery-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      entities: []
    };
  }
}

customElements.define('battery-dashboard-card', BatteryDashboardCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'battery-dashboard-card',
  name: 'Battery Dashboard Card',
  description: 'Une carte pour afficher l\'état des batteries'
});

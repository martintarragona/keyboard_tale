import type { AudioEngine } from './AudioEngine';
import type { SynthesisMode } from '../types';

/**
 * AudioUI
 *
 * Interfaz de usuario para controlar el motor de audio en tiempo real.
 * Proporciona controles para:
 * - Modo de síntesis
 * - Volumen
 * - Efectos (reverb, delay)
 * - Panning espacial
 * - Activar/desactivar audio
 */
export class AudioUI {
  private audioEngine: AudioEngine;
  private container: HTMLElement;
  private isVisible: boolean = false;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.container = this.createContainer();
    document.body.appendChild(this.container);

    // Añadir listener para toggle con tecla 'C'
    document.addEventListener('keydown', (e) => {
      if (e.key === 'c' || e.key === 'C') {
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
          this.toggle();
        }
      }
    });
  }

  /**
   * Crea el contenedor de la interfaz
   */
  private createContainer(): HTMLElement {
    const container = document.createElement('div');
    container.id = 'audio-controls';
    container.className = 'audio-controls hidden';
    container.innerHTML = this.buildHTML();

    // Añadir event listeners después de crear el HTML
    setTimeout(() => this.attachEventListeners(), 0);

    return container;
  }

  /**
   * Construye el HTML de la interfaz
   */
  private buildHTML(): string {
    const config = this.audioEngine.getConfig();

    return `
      <div class="audio-controls-header">
        <h3>Audio Configuration</h3>
        <button class="close-btn" id="audio-close-btn">×</button>
      </div>

      <div class="audio-controls-content">
        <!-- Modo de síntesis -->
        <div class="control-group">
          <label>Synthesis Mode</label>
          <select id="synthesis-mode" class="control-select">
            <option value="granular" ${config.synthesisMode === 'granular' ? 'selected' : ''}>Granular (Original)</option>
            <option value="pentatonic" ${config.synthesisMode === 'pentatonic' ? 'selected' : ''}>Pentatonic Scale</option>
            <option value="harmonic" ${config.synthesisMode === 'harmonic' ? 'selected' : ''}>Harmonic Series</option>
            <option value="microtonal" ${config.synthesisMode === 'microtonal' ? 'selected' : ''}>Microtonal</option>
            <option value="ambient" ${config.synthesisMode === 'ambient' ? 'selected' : ''}>Ambient</option>
          </select>
        </div>

        <!-- Volumen -->
        <div class="control-group">
          <label>
            Volume
            <span class="control-value" id="volume-value">${config.volume} dB</span>
          </label>
          <input
            type="range"
            id="volume-slider"
            class="control-slider"
            min="-30"
            max="0"
            step="1"
            value="${config.volume}"
          />
        </div>

        <!-- Audio On/Off -->
        <div class="control-group">
          <label class="control-checkbox">
            <input
              type="checkbox"
              id="audio-enabled"
              ${config.enabled ? 'checked' : ''}
            />
            <span>Audio Enabled</span>
          </label>
        </div>

        <!-- Reverb -->
        <div class="control-group">
          <label class="control-checkbox">
            <input
              type="checkbox"
              id="reverb-enabled"
              ${config.reverbEnabled ? 'checked' : ''}
            />
            <span>Reverb</span>
          </label>
          <label>
            Amount
            <span class="control-value" id="reverb-value">${Math.round(config.reverbAmount * 100)}%</span>
          </label>
          <input
            type="range"
            id="reverb-slider"
            class="control-slider"
            min="0"
            max="1"
            step="0.01"
            value="${config.reverbAmount}"
          />
        </div>

        <!-- Delay -->
        <div class="control-group">
          <label class="control-checkbox">
            <input
              type="checkbox"
              id="delay-enabled"
              ${config.delayEnabled ? 'checked' : ''}
            />
            <span>Delay</span>
          </label>
          <label>
            Amount
            <span class="control-value" id="delay-value">${Math.round(config.delayAmount * 100)}%</span>
          </label>
          <input
            type="range"
            id="delay-slider"
            class="control-slider"
            min="0"
            max="1"
            step="0.01"
            value="${config.delayAmount}"
          />
        </div>

        <!-- Panning -->
        <div class="control-group">
          <label class="control-checkbox">
            <input
              type="checkbox"
              id="panning-enabled"
              ${config.panningEnabled ? 'checked' : ''}
            />
            <span>Spatial Panning</span>
          </label>
        </div>
      </div>

      <div class="audio-controls-footer">
        <p class="hint">Press 'C' to toggle this panel</p>
      </div>
    `;
  }

  /**
   * Adjunta event listeners a los controles
   */
  private attachEventListeners(): void {
    // Close button
    const closeBtn = document.getElementById('audio-close-btn');
    closeBtn?.addEventListener('click', () => this.hide());

    // Synthesis mode
    const modeSelect = document.getElementById('synthesis-mode') as HTMLSelectElement;
    modeSelect?.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.audioEngine.updateConfig({
        synthesisMode: target.value as SynthesisMode
      });
    });

    // Volume
    const volumeSlider = document.getElementById('volume-slider') as HTMLInputElement;
    const volumeValue = document.getElementById('volume-value');
    volumeSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      if (volumeValue) volumeValue.textContent = `${value} dB`;
      this.audioEngine.updateConfig({ volume: value });
    });

    // Audio enabled
    const audioEnabled = document.getElementById('audio-enabled') as HTMLInputElement;
    audioEnabled?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.audioEngine.setEnabled(target.checked);
    });

    // Reverb
    const reverbEnabled = document.getElementById('reverb-enabled') as HTMLInputElement;
    reverbEnabled?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.audioEngine.updateConfig({ reverbEnabled: target.checked });
    });

    const reverbSlider = document.getElementById('reverb-slider') as HTMLInputElement;
    const reverbValue = document.getElementById('reverb-value');
    reverbSlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      if (reverbValue) reverbValue.textContent = `${Math.round(value * 100)}%`;
      this.audioEngine.updateConfig({ reverbAmount: value });
    });

    // Delay
    const delayEnabled = document.getElementById('delay-enabled') as HTMLInputElement;
    delayEnabled?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.audioEngine.updateConfig({ delayEnabled: target.checked });
    });

    const delaySlider = document.getElementById('delay-slider') as HTMLInputElement;
    const delayValue = document.getElementById('delay-value');
    delaySlider?.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = parseFloat(target.value);
      if (delayValue) delayValue.textContent = `${Math.round(value * 100)}%`;
      this.audioEngine.updateConfig({ delayAmount: value });
    });

    // Panning
    const panningEnabled = document.getElementById('panning-enabled') as HTMLInputElement;
    panningEnabled?.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      this.audioEngine.updateConfig({ panningEnabled: target.checked });
    });
  }

  /**
   * Muestra el panel de controles
   */
  show(): void {
    this.container.classList.remove('hidden');
    this.isVisible = true;
  }

  /**
   * Oculta el panel de controles
   */
  hide(): void {
    this.container.classList.add('hidden');
    this.isVisible = false;
  }

  /**
   * Alterna visibilidad del panel
   */
  toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Actualiza la interfaz con la configuración actual
   */
  refresh(): void {
    // Re-crear el contenedor con los valores actualizados
    const newContainer = this.createContainer();
    this.container.replaceWith(newContainer);
    this.container = newContainer;
  }
}

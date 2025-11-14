import './style.css';
import { TextParser } from './core/TextParser';
import { KeyboardController } from './core/KeyboardController';
import { AudioEngine } from './core/AudioEngine';
import { AudioUI } from './core/AudioUI';
import { TextDisplay } from './core/TextDisplay';
import type { AudioSignal, TypingState } from './types';

// Importar el texto
import taleText from './data/texts/tale.txt?raw';

/**
 * Aplicación principal - Keyboard Tale
 */
class KeyboardTaleApp {
  private audioEngine: AudioEngine;
  private audioUI: AudioUI | null = null;
  private keyboardController: KeyboardController | null = null;
  private textDisplay: TextDisplay | null = null;
  private textDisplayEl: HTMLElement;
  private mobileInputEl: HTMLInputElement | null = null;
  private isAudioInitialized: boolean = false;

  constructor() {
    // Obtener elementos del DOM
    this.textDisplayEl = document.getElementById('text-display') as HTMLElement;
    this.mobileInputEl = document.getElementById('mobile-input') as HTMLInputElement;

    // Inicializar el motor de audio
    this.audioEngine = new AudioEngine();

    // Configurar event listeners
    this.setupEventListeners();

    // Iniciar la experiencia directamente
    this.initialize();
  }

  /**
   * Inicializa la experiencia mostrando el primer bloque
   */
  private initialize(): void {
    // Cargar y parsear el texto
    this.loadText(taleText);

    // Renderizar el primer bloque
    if (this.textDisplay) {
      this.textDisplay.render();
    }

    // En dispositivos móviles, hacer focus automático en el input
    if (this.mobileInputEl && this.isMobileDevice()) {
      // Pequeño delay para asegurar que el DOM está listo
      setTimeout(() => {
        this.mobileInputEl!.focus();
      }, 100);
    }
  }

  /**
   * Detecta si es un dispositivo móvil
   */
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  /**
   * Configura los event listeners
   */
  private setupEventListeners(): void {
    // Listener de teclado global (solo para desktop, no para mobile)
    document.addEventListener('keydown', async (event) => {
      // Si estamos en mobile, ignorar este listener (usamos el input invisible)
      if (this.mobileInputEl && document.activeElement === this.mobileInputEl) {
        return;
      }

      // Inicializar audio en la primera interacción
      if (!this.isAudioInitialized) {
        await this.audioEngine.initialize();
        this.isAudioInitialized = true;

        // Inicializar UI de audio
        if (!this.audioUI) {
          this.audioUI = new AudioUI(this.audioEngine);
        }
      }

      // Iniciar el controlador si no está activo
      if (this.keyboardController && !this.keyboardController.getState().isActive) {
        this.keyboardController.start();
      }

      // Ignorar teclas especiales
      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key.length > 1) return; // Ignorar teclas como 'Shift', 'Enter', etc.

      this.handleKeyPress(event.key);
    });

    // Mobile input: handle input events
    if (this.mobileInputEl) {
      // Limpiar el input al inicio
      this.mobileInputEl.value = '';

      // Inicializar audio y controlador en el primer focus del input
      this.mobileInputEl.addEventListener('focus', async () => {
        if (!this.isAudioInitialized) {
          await this.audioEngine.initialize();
          this.isAudioInitialized = true;

          // Inicializar UI de audio
          if (!this.audioUI) {
            this.audioUI = new AudioUI(this.audioEngine);
          }
        }

        if (this.keyboardController && !this.keyboardController.getState().isActive) {
          this.keyboardController.start();
        }
      }, { once: true });

      // Variable para trackear si beforeinput procesó el carácter
      let beforeInputHandled = false;

      // Usar beforeinput - se dispara SOLO cuando hay input real del usuario
      this.mobileInputEl.addEventListener('beforeinput', (event: Event) => {
        const inputEvent = event as InputEvent;

        // Solo procesar si realmente hay datos del usuario
        if (inputEvent.data && inputEvent.data.length > 0) {
          const char = inputEvent.data[0];
          this.handleKeyPress(char);

          // Marcar que beforeinput manejó esto
          beforeInputHandled = true;

          // Prevenir que se agregue al input
          event.preventDefault();

          // Limpiar el input
          this.mobileInputEl!.value = '';

          // Reset del flag después de un tick
          setTimeout(() => {
            beforeInputHandled = false;
          }, 0);
        }
      });

      // Fallback para navegadores que no soportan beforeinput
      this.mobileInputEl.addEventListener('input', () => {
        // Si beforeinput ya lo manejó, no hacer nada
        if (beforeInputHandled) {
          return;
        }

        const value = this.mobileInputEl!.value;

        // Solo procesar si hay un valor
        if (value.length > 0) {
          const lastChar = value[value.length - 1];
          this.handleKeyPress(lastChar);
        }

        // Limpiar el input
        this.mobileInputEl!.value = '';
      });

      // Mantener el input siempre enfocado en móvil
      this.mobileInputEl.addEventListener('blur', (e) => {
        if (this.keyboardController?.getState().isActive) {
          // Verificar si el blur fue causado por interacción con el panel de audio
          const relatedTarget = e.relatedTarget as HTMLElement;
          const audioControls = document.getElementById('audio-controls');

          // Si el foco se mueve al panel de audio o a sus elementos, no re-enfocar
          if (relatedTarget && audioControls && audioControls.contains(relatedTarget)) {
            return;
          }

          // Verificar si el panel de audio está visible
          if (audioControls && !audioControls.classList.contains('hidden')) {
            // Si el panel está visible, esperar un poco más para ver si el usuario está interactuando
            // No re-enfocar inmediatamente para permitir interacción con controles
            return;
          }

          // Re-enfocar después de un pequeño delay
          setTimeout(() => {
            this.mobileInputEl?.focus();
          }, 50);
        }
      });
    }
  }

  /**
   * Carga y parsea el texto
   */
  private loadText(text: string): void {
    const parsedText = TextParser.parse(text);

    // Crear el controlador de teclado
    this.keyboardController = new KeyboardController(
      parsedText,
      (signal: AudioSignal) => this.handleAudioSignal(signal),
      (state: TypingState) => this.handleStateChange(state),
      () => this.handleComplete()
    );

    // Crear el display de texto
    this.textDisplay = new TextDisplay(this.textDisplayEl, parsedText);

    console.log('Text loaded:', parsedText);
  }

  /**
   * Reinicia la experiencia desde cero
   */
  private restart(): void {
    console.log('Restarting Keyboard Tale...');

    // Reiniciar todo
    if (this.keyboardController) {
      this.keyboardController.reset();
    }

    if (this.textDisplay) {
      this.textDisplay.reset();
    }

    // Volver a inicializar
    this.initialize();
  }

  /**
   * Maneja una tecla presionada
   */
  private handleKeyPress(key: string): void {
    if (!this.keyboardController) return;
    this.keyboardController.handleKeyPress(key);
  }

  /**
   * Maneja las señales de audio del controlador
   */
  private handleAudioSignal(signal: AudioSignal): void {
    this.audioEngine.processSignal(signal);
  }

  /**
   * Maneja los cambios de estado
   */
  private handleStateChange(state: TypingState): void {
    if (!this.textDisplay) return;
    this.textDisplay.updateState(state);
  }

  /**
   * Maneja la completación del texto
   */
  private handleComplete(): void {
    console.log('Keyboard Tale completed!');

    if (!this.textDisplay) return;

    // Fundir a negro
    this.textDisplay.fadeToBlack();

    // Reiniciar después de 3 segundos
    setTimeout(() => {
      this.restart();
    }, 3000);
  }
}

// Iniciar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  new KeyboardTaleApp();
});

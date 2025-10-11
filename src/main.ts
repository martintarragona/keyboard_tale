import './style.css';
import { TextParser } from './core/TextParser';
import { KeyboardController } from './core/KeyboardController';
import { AudioEngine } from './core/AudioEngine';
import { TextDisplay } from './core/TextDisplay';
import type { AudioSignal, TypingState } from './types';

// Importar el texto
import taleText from './data/texts/tale.txt?raw';

/**
 * Aplicación principal - Keyboard Tale
 */
class KeyboardTaleApp {
  private audioEngine: AudioEngine;
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
  }

  /**
   * Configura los event listeners
   */
  private setupEventListeners(): void {
    // Listener de teclado global (always active for desktop)
    document.addEventListener('keydown', async (event) => {
      // Prevent double handling on mobile: if hidden input is focused, skip keydown
      if (this.mobileInputEl && document.activeElement === this.mobileInputEl) return;

      // Inicializar audio en la primera interacción
      if (!this.isAudioInitialized) {
        await this.audioEngine.initialize();
        this.isAudioInitialized = true;
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

    // Mobile input: focus and handle input events only on mobile devices
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && this.mobileInputEl) {
      // Focus input on touch/click to show keyboard
      const focusInput = () => {
        this.mobileInputEl!.focus();
      };
      document.addEventListener('touchstart', focusInput);
      document.addEventListener('click', focusInput);

      // Helper to process and clear input
      const processMobileInput = () => {
        const value = this.mobileInputEl!.value;
        if (value.length === 1) {
          this.handleKeyPress(value);
          this.mobileInputEl!.value = '';
        } else if (value.length > 1) {
          this.handleKeyPress(value[0]);
          this.mobileInputEl!.value = '';
        }
      };
      this.mobileInputEl.addEventListener('input', processMobileInput);
      this.mobileInputEl.addEventListener('keyup', processMobileInput);
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

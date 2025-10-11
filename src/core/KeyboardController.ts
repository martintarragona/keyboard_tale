import type { ParsedText, AudioSignal, TypingState, Character } from '../types';
import { TextParser } from './TextParser';

/**
 * KeyboardController
 *
 * Gestiona el estado del tecleado y valida las teclas presionadas.
 * Genera las señales de control para el motor de audio.
 */
export class KeyboardController {
  private parsedText: ParsedText;
  private state: TypingState;
  private onAudioSignal: (signal: AudioSignal) => void;
  private onStateChange: (state: TypingState) => void;
  private onComplete: () => void;

  constructor(
    parsedText: ParsedText,
    onAudioSignal: (signal: AudioSignal) => void,
    onStateChange: (state: TypingState) => void,
    onComplete: () => void
  ) {
    this.parsedText = parsedText;
    this.onAudioSignal = onAudioSignal;
    this.onStateChange = onStateChange;
    this.onComplete = onComplete;

    this.state = {
      currentBlockIndex: 0,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      isActive: false,
      hasError: false,
      totalErrors: 0
    };
  }

  /**
   * Inicia el sistema de tecleado
   */
  start(): void {
    this.state.isActive = true;
    this.notifyStateChange();
  }

  /**
   * Detiene el sistema de tecleado
   */
  stop(): void {
    this.state.isActive = false;
    this.notifyStateChange();
  }

  /**
   * Reinicia el estado a inicial
   */
  reset(): void {
    this.state = {
      currentBlockIndex: 0,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      isActive: false,
      hasError: false,
      totalErrors: 0
    };

    // Resetear todos los caracteres
    this.parsedText.blocks.forEach(block => {
      block.words.forEach(word => {
        word.characters.forEach(char => {
          char.isTyped = false;
          char.isError = false;
        });
      });
    });

    this.notifyStateChange();
  }

  /**
   * Maneja una tecla presionada
   */
  handleKeyPress(key: string): void {
    if (!this.state.isActive) return;

    const currentChar = this.getCurrentCharacter();
    if (!currentChar) return;

    // Normalizar la tecla presionada (lowercase)
    const normalizedKey = key.toLowerCase();
    const expectedChar = currentChar.char.toLowerCase();

    const isCorrect = normalizedKey === expectedChar;

    // Generar señal de audio
    const signal = this.generateAudioSignal(isCorrect);
    this.onAudioSignal(signal);

    if (isCorrect) {
      // Marcar como tecleado
      currentChar.isTyped = true;
      currentChar.isError = false;
      this.state.hasError = false;

      // Avanzar al siguiente carácter
      this.advance();
    } else {
      // Error
      currentChar.isError = true;
      this.state.hasError = true;
      this.state.totalErrors++;

      // El error se visualiza pero no bloquea el avance
      // (el usuario puede seguir intentando)
    }

    this.notifyStateChange();
  }

  /**
   * Avanza al siguiente carácter (letra)
   */
  private advance(): void {
    const currentBlock = this.parsedText.blocks[this.state.currentBlockIndex];
    const currentWord = currentBlock.words[this.state.currentWordIndex];
    const letters = TextParser.getLettersOnly(currentWord);

    this.state.currentLetterIndex++;

    // Si terminó la palabra actual
    if (this.state.currentLetterIndex >= letters.length) {
      this.state.currentLetterIndex = 0;
      this.state.currentWordIndex++;

      // Si terminó el bloque actual
      if (this.state.currentWordIndex >= currentBlock.words.length) {
        this.state.currentWordIndex = 0;
        this.state.currentBlockIndex++;

        // Si terminó todo el texto
        if (this.state.currentBlockIndex >= this.parsedText.blocks.length) {
          this.complete();
        }
      }
    }
  }

  /**
   * Obtiene el carácter (letra) actual que se debe teclear
   */
  private getCurrentCharacter(): Character | null {
    if (this.state.currentBlockIndex >= this.parsedText.blocks.length) {
      return null;
    }

    const currentBlock = this.parsedText.blocks[this.state.currentBlockIndex];
    if (this.state.currentWordIndex >= currentBlock.words.length) {
      return null;
    }

    const currentWord = currentBlock.words[this.state.currentWordIndex];
    const letters = TextParser.getLettersOnly(currentWord);

    if (this.state.currentLetterIndex >= letters.length) {
      return null;
    }

    return letters[this.state.currentLetterIndex];
  }

  /**
   * Genera la señal de audio con toda la información de contexto
   */
  private generateAudioSignal(isCorrect: boolean): AudioSignal {
    const currentBlock = this.parsedText.blocks[this.state.currentBlockIndex];
    const currentWord = currentBlock.words[this.state.currentWordIndex];
    const letters = TextParser.getLettersOnly(currentWord);
    const currentChar = letters[this.state.currentLetterIndex];

    return {
      wordIndexInBlock: this.state.currentWordIndex,
      totalWordsInBlock: currentBlock.words.length,
      letterIndexInWord: this.state.currentLetterIndex,
      totalLettersInWord: letters.length,
      blockIndexInText: this.state.currentBlockIndex,
      totalBlocksInText: this.parsedText.blocks.length,
      isError: !isCorrect,
      character: currentChar.char,
      timestamp: Date.now()
    };
  }

  /**
   * Completa el proceso de tecleado
   */
  private complete(): void {
    this.state.isActive = false;
    this.notifyStateChange();
    this.onComplete();
  }

  /**
   * Notifica cambios en el estado
   */
  private notifyStateChange(): void {
    this.onStateChange({ ...this.state });
  }

  /**
   * Obtiene el estado actual
   */
  getState(): TypingState {
    return { ...this.state };
  }

  /**
   * Obtiene el texto parseado
   */
  getParsedText(): ParsedText {
    return this.parsedText;
  }
}

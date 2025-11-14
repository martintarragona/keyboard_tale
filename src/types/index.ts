/**
 * Representa un carácter individual en el texto
 */
export interface Character {
  char: string;
  isLetter: boolean;
  isTyped: boolean;
  isError: boolean;
}

/**
 * Representa una palabra en el texto
 */
export interface Word {
  characters: Character[];
  originalText: string;
}

/**
 * Representa una línea de texto (separada por salto de línea simple)
 */
export interface Line {
  words: Word[];
  originalText: string;
}

/**
 * Representa un bloque de texto (separado por doble salto de línea)
 */
export interface Block {
  lines: Line[];
  words: Word[]; // Todas las palabras del bloque (para compatibilidad)
  originalText: string;
}

/**
 * Estructura completa del texto parseado
 */
export interface ParsedText {
  blocks: Block[];
  originalText: string;
}

/**
 * Señal de control que se envía al motor de audio
 */
export interface AudioSignal {
  // Índices y contadores
  wordIndexInBlock: number;
  totalWordsInBlock: number;
  letterIndexInWord: number;
  totalLettersInWord: number;
  blockIndexInText: number;
  totalBlocksInText: number;

  // Estado
  isError: boolean;

  // Carácter actual
  character: string;

  // Timestamp
  timestamp: number;
}

/**
 * Estado actual del sistema de tecleado
 */
export interface TypingState {
  currentBlockIndex: number;
  currentWordIndex: number;
  currentLetterIndex: number;
  isActive: boolean;
  hasError: boolean;
  totalErrors: number;
}

/**
 * Modos de síntesis disponibles
 */
export type SynthesisMode =
  | 'granular'      // Modo original (Pure Data inspired)
  | 'pentatonic'    // Escala pentatónica
  | 'harmonic'      // Serie armónica
  | 'microtonal'    // Escala microtonal
  | 'ambient';      // Modo ambiental con delays largos

/**
 * Configuración del motor de audio
 */
export interface AudioConfig {
  volume: number;
  enabled: boolean;
  noteDuration: string;
  baseOctave: number;
  synthesisMode: SynthesisMode;
  reverbEnabled: boolean;
  reverbAmount: number;
  delayEnabled: boolean;
  delayAmount: number;
  panningEnabled: boolean;
}

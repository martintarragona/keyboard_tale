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
 * Representa un bloque de texto (separado por doble salto de línea)
 */
export interface Block {
  words: Word[];
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
 * Configuración del motor de audio
 */
export interface AudioConfig {
  volume: number;
  enabled: boolean;
  noteDuration: string;
  baseOctave: number;
}

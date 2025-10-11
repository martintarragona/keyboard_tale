import type { ParsedText, Block, Word, Character } from '../types';

/**
 * TextParser
 *
 * Responsable de parsear el texto de entrada y convertirlo en una estructura
 * de datos navegable (bloques -> palabras -> caracteres).
 *
 * Los espacios y signos de puntuación se ignoran para el tecleado, pero se
 * mantienen para la visualización.
 */
export class TextParser {
  /**
   * Parsea un texto completo en la estructura de bloques
   * @param text Texto completo con bloques separados por doble salto de línea
   */
  static parse(text: string): ParsedText {
    // Dividir el texto en bloques (separados por doble salto de línea)
    const blockTexts = text
      .split('\n\n')
      .map(block => block.trim())
      .filter(block => block.length > 0);

    const blocks: Block[] = blockTexts.map(blockText =>
      this.parseBlock(blockText)
    );

    return {
      blocks,
      originalText: text
    };
  }

  /**
   * Parsea un bloque individual en palabras
   */
  private static parseBlock(blockText: string): Block {
    // Dividir en palabras (separadas por espacios)
    const wordTexts = blockText
      .split(/\s+/)
      .filter(word => word.length > 0);

    const words: Word[] = wordTexts.map(wordText =>
      this.parseWord(wordText)
    );

    return {
      words,
      originalText: blockText
    };
  }

  /**
   * Parsea una palabra individual en caracteres
   * Separa las letras de los signos de puntuación
   */
  private static parseWord(wordText: string): Word {
    const characters: Character[] = [];

    for (const char of wordText) {
      const isLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(char);

      characters.push({
        char,
        isLetter,
        isTyped: false,
        isError: false
      });
    }

    return {
      characters,
      originalText: wordText
    };
  }

  /**
   * Obtiene solo las letras de una palabra (sin puntuación)
   * Útil para comparar lo que el usuario debe teclear
   */
  static getLettersOnly(word: Word): Character[] {
    return word.characters.filter(char => char.isLetter);
  }

  /**
   * Obtiene el total de letras en un bloque (sin contar puntuación ni espacios)
   */
  static getTotalLettersInBlock(block: Block): number {
    return block.words.reduce((total, word) => {
      return total + this.getLettersOnly(word).length;
    }, 0);
  }

  /**
   * Obtiene el total de letras en todo el texto
   */
  static getTotalLetters(parsedText: ParsedText): number {
    return parsedText.blocks.reduce((total, block) => {
      return total + this.getTotalLettersInBlock(block);
    }, 0);
  }
}

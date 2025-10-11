import type { ParsedText, TypingState, Block } from '../types';

/**
 * TextDisplay
 *
 * Responsable de renderizar el texto en el DOM y actualizarlo
 * según el estado del tecleado.
 *
 * Muestra todos los bloques (completos + el actual) sin borrar los anteriores.
 */
export class TextDisplay {
  private container: HTMLElement;
  private parsedText: ParsedText;
  private currentState: TypingState;

  constructor(container: HTMLElement, parsedText: ParsedText) {
    this.container = container;
    this.parsedText = parsedText;
    this.currentState = {
      currentBlockIndex: 0,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      isActive: false,
      hasError: false,
      totalErrors: 0
    };
  }

  /**
   * Renderiza todos los bloques (completos y el actual)
   */
  render(): void {
    this.container.innerHTML = '';

    if (this.currentState.currentBlockIndex >= this.parsedText.blocks.length) {
      this.renderComplete();
      return;
    }

    // Renderizar todos los bloques hasta el actual (inclusive)
    for (let blockIndex = 0; blockIndex <= this.currentState.currentBlockIndex; blockIndex++) {
      const block = this.parsedText.blocks[blockIndex];
      const isCurrentBlock = blockIndex === this.currentState.currentBlockIndex;

      this.renderBlock(block, blockIndex, isCurrentBlock);

      // Agregar separación entre bloques (doble salto de línea)
      if (blockIndex < this.currentState.currentBlockIndex) {
        const separator = document.createElement('div');
        separator.style.height = '2rem';
        this.container.appendChild(separator);
      }
    }
  }

  /**
   * Renderiza un bloque completo
   */
  private renderBlock(block: Block, _blockIndex: number, isCurrentBlock: boolean): void {
    const blockDiv = document.createElement('div');
    blockDiv.className = 'block';
    if (!isCurrentBlock) {
      blockDiv.classList.add('completed');
    }

    let globalLetterIndex = 0;

    block.words.forEach((word, wordIndex) => {
      const wordSpan = document.createElement('span');
      wordSpan.className = 'word';

      let lastLetterInWordIndex = -1;

      // Encontrar el índice de la última letra en la palabra
      for (let i = word.characters.length - 1; i >= 0; i--) {
        if (word.characters[i].isLetter) {
          lastLetterInWordIndex = i;
          break;
        }
      }

      word.characters.forEach((char, charIndex) => {
        const charSpan = document.createElement('span');

        if (char.isLetter) {
          charSpan.className = 'letter';

          // Determinar el estado del carácter
          if (char.isTyped) {
            charSpan.classList.add('typed');
          } else if (char.isError) {
            charSpan.classList.add('error');
          }

          // Marcar el carácter actual (solo en el bloque actual)
          if (
            isCurrentBlock &&
            wordIndex === this.currentState.currentWordIndex &&
            globalLetterIndex === this.currentState.currentLetterIndex
          ) {
            charSpan.classList.add('current');
          }

          globalLetterIndex++;
        } else {
          // Signos de puntuación
          charSpan.className = 'punctuation';

          // La puntuación se marca como "typed" solo si:
          // - Es la última letra de una palabra completada
          // - O si estamos en un bloque completado
          const isWordCompleted = !isCurrentBlock ||
            (isCurrentBlock && wordIndex < this.currentState.currentWordIndex);

          const isLastLetterTyped = charIndex > lastLetterInWordIndex &&
            word.characters[lastLetterInWordIndex]?.isTyped;

          if (isWordCompleted || isLastLetterTyped) {
            charSpan.classList.add('typed');
          }
        }

        charSpan.textContent = char.char;
        wordSpan.appendChild(charSpan);
      });

      blockDiv.appendChild(wordSpan);

      // Agregar espacio entre palabras
      if (wordIndex < block.words.length - 1) {
        const space = document.createElement('span');
        space.className = 'space';

        // El espacio se marca como typed si la palabra anterior está completa
        const isPrevWordCompleted = !isCurrentBlock ||
          (isCurrentBlock && wordIndex < this.currentState.currentWordIndex);

        if (isPrevWordCompleted) {
          space.classList.add('typed');
        }

        space.textContent = ' ';
        blockDiv.appendChild(space);
      }
    });

    this.container.appendChild(blockDiv);
  }

  /**
   * Renderiza el mensaje de completado (sin mensaje, solo los bloques)
   */
  private renderComplete(): void {
    // Renderizar todos los bloques completos
    this.parsedText.blocks.forEach((block, blockIndex) => {
      this.renderBlock(block, blockIndex, false);

      if (blockIndex < this.parsedText.blocks.length - 1) {
        const separator = document.createElement('div');
        separator.style.height = '2rem';
        this.container.appendChild(separator);
      }
    });
  }

  /**
   * Fundir el texto a negro con animación
   */
  fadeToBlack(): void {
    this.container.classList.add('fade-to-black');
  }

  /**
   * Actualiza el estado y re-renderiza
   */
  updateState(state: TypingState): void {
    this.currentState = state;
    this.render();
  }

  /**
   * Reinicia la visualización
   */
  reset(): void {
    this.currentState = {
      currentBlockIndex: 0,
      currentWordIndex: 0,
      currentLetterIndex: 0,
      isActive: false,
      hasError: false,
      totalErrors: 0
    };
    // Remover la clase de fade
    this.container.classList.remove('fade-to-black');
    this.render();
  }
}

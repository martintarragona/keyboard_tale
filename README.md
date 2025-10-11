# Keyboard Tale

Una experiencia interactiva donde el tecleado se convierte en música.

## Descripción

Keyboard Tale es una aplicación web que transforma la escritura en una experiencia musical interactiva. Al escribir un texto predefinido, cada letra tecleada genera notas musicales basadas en su posición en el texto, creando una melodía única.

## Características

- **Sistema de tecleado interactivo**: Sigue el texto palabra por palabra, letra por letra
- **Generación de audio en tiempo real**: Usa Tone.js para síntesis de audio
- **Visualización dinámica**: El texto cambia de color según el progreso
- **Señales de control detalladas**: Información completa sobre posición en palabra, bloque y texto
- **Manejo de errores**: Sonidos especiales cuando se teclea incorrectamente

## Tecnologías

- **TypeScript**: Lenguaje principal
- **Vite**: Build tool y dev server
- **Tone.js**: Motor de síntesis de audio (Web Audio API)
- **Vanilla JS**: Sin frameworks, máximo rendimiento

## Estructura del Proyecto

```
keyboard_tale/
├── src/
│   ├── core/
│   │   ├── TextParser.ts          # Parsea texto en bloques/palabras/letras
│   │   ├── KeyboardController.ts  # Controla el tecleado y estado
│   │   ├── AudioEngine.ts         # Motor de audio con Tone.js
│   │   └── TextDisplay.ts         # Renderiza y actualiza el texto
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript
│   ├── data/
│   │   └── texts/
│   │       └── lorem.txt          # Texto inicial (Lorem Ipsum)
│   ├── main.ts                    # Punto de entrada
│   └── style.css                  # Estilos
└── index.html                     # HTML principal
```

## Instalación y Uso

### Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# El navegador se abrirá automáticamente en http://localhost:3000
```

### Build para Producción

```bash
# Compilar y construir
npm run build

# Vista previa del build
npm run preview
```

## Cómo Usar

1. Abre la aplicación en tu navegador
2. Haz clic en el botón **"Comenzar"**
3. Empieza a escribir las letras que aparecen en pantalla
4. Cada letra correcta generará una nota musical
5. Los errores producirán un sonido diferente
6. Completa todos los bloques de texto

**Nota**: Los espacios y signos de puntuación se rellenan automáticamente, solo necesitas escribir las letras.

## Señales de Audio

El sistema genera señales de control completas para cada tecla presionada:

```typescript
{
  wordIndexInBlock: number,        // Posición de la palabra en el bloque
  totalWordsInBlock: number,       // Total de palabras en el bloque
  letterIndexInWord: number,       // Posición de la letra en la palabra
  totalLettersInWord: number,      // Total de letras en la palabra
  blockIndexInText: number,        // Posición del bloque en el texto
  totalBlocksInText: number,       // Total de bloques en el texto
  isError: boolean,                // Si hubo error al teclear
  character: string,               // Carácter actual
  timestamp: number                // Timestamp del evento
}
```

Estas señales permiten crear experiencias musicales complejas basadas en el contexto del tecleado.

## Generación de Música (Implementación Actual)

La implementación actual usa una estrategia simple:

- **Nota**: Determinada por la posición de la palabra en el bloque (escala pentatónica)
- **Octava**: Determinada por la posición de la letra en la palabra (octavas 4-7)
- **Errores**: Sonido disonante en C2

Esta estrategia es un punto de partida y puede ser expandida para crear melodías más complejas.

## Agregar Nuevos Textos

1. Crea un archivo `.txt` en `src/data/texts/`
2. Separa los bloques con doble salto de línea (`\n\n`)
3. Importa el texto en `main.ts`:

```typescript
import nuevoTexto from './data/texts/nuevo.txt?raw';
```

4. Usa el texto en `loadText()`:

```typescript
this.loadText(nuevoTexto);
```

## Próximas Mejoras

- [ ] Selector de textos múltiples
- [ ] Estadísticas de velocidad (WPM)
- [ ] Diferentes modos de juego
- [ ] Configuración de audio (volumen, instrumentos)
- [ ] Sistema de melodías más complejo
- [ ] Efectos visuales sincronizados con audio
- [ ] Modo multijugador

## Despliegue Web

El proyecto está listo para ser desplegado en cualquier plataforma de hosting estático:

- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Configura el workflow de GitHub Actions

## Licencia

MIT

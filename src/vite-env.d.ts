/// <reference types="vite/client" />

// Declaración para importar archivos .txt como raw strings
declare module '*.txt' {
  const content: string;
  export default content;
}

declare module '*.txt?raw' {
  const content: string;
  export default content;
}

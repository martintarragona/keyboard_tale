import * as Tone from 'tone';
import type { AudioSignal, AudioConfig } from '../types';

/**
 * AudioEngine
 *
 * Motor de audio basado en el patch Pure Data kt.pd de la versión anterior.
 *
 * Emula el comportamiento del patch:
 * - Oscilador sinusoidal con frecuencia = iChar * 200
 * - Ruido filtrado con low-pass con frecuencia = iWord * 200
 * - Envelope de 1 segundo que modula la mezcla
 * - Volumen general de 0.1
 */
export class AudioEngine {
  private oscillator: Tone.Oscillator;
  private noise: Tone.Noise;
  private lowPassFilter: Tone.Filter;
  private envelope: Tone.AmplitudeEnvelope;
  private noiseEnvelope: Tone.AmplitudeEnvelope;
  private masterGain: Tone.Gain;
  private config: AudioConfig;
  private isInitialized: boolean = false;

  // Envelope shape basado en el array 'env' del patch PD
  private readonly envelopeTime = 1.0; // 1 segundo como en el patch

  constructor(config?: Partial<AudioConfig>) {
    this.config = {
      volume: -10,
      enabled: true,
      noteDuration: '1n',
      baseOctave: 4,
      ...config
    };

    // Crear la cadena de audio similar al patch PD

    // Oscilador sinusoidal (osc~ 500 en PD)
    this.oscillator = new Tone.Oscillator({
      frequency: 500,
      type: 'sine'
    });

    // Ruido (noise~ en PD)
    this.noise = new Tone.Noise('white');

    // Filtro low-pass para el ruido (lop~ en PD)
    this.lowPassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 200,
      rolloff: -12
    });

    // Envelope para el oscilador (basado en el array env y tabread4)
    // El envelope tiene una forma específica que sube rápido y baja lento
    this.envelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.7
    });

    // Envelope para el ruido
    this.noiseEnvelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.7
    });

    // Gain master (*~ 0.1 en PD)
    this.masterGain = new Tone.Gain(0.1);

    // Conectar la cadena de audio
    // Ruido -> Filtro -> Envelope -> Master
    this.noise.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.masterGain);

    // Oscilador -> Envelope -> Master
    this.oscillator.connect(this.envelope);
    this.envelope.connect(this.masterGain);

    // Master -> Salida
    this.masterGain.toDestination();

    // Iniciar los generadores (pero sin sonido hasta que se dispare el envelope)
    this.oscillator.start();
    this.noise.start();
  }

  /**
   * Inicializa el contexto de audio (debe ser llamado después de interacción del usuario)
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await Tone.start();
    //console.log('Audio engine initialized (Pure Data style)');
    this.isInitialized = true;
  }

  /**
   * Procesa una señal de audio y genera el sonido correspondiente
   *
   * Similar al patch PD:
   * - message = "iBlock iWord iChar word char"
   * - unpack float float float -> iBlock iWord iChar
   * - iWord * 200 -> frecuencia del filtro
   * - iChar * 200 -> frecuencia del oscilador
   */
  processSignal(signal: AudioSignal): void {
    if (!this.config.enabled || !this.isInitialized) return;

    if (signal.isError) {
      // this.playErrorSound();
      return;
    }

    // Calcular frecuencias según el patch PD
    // En PD: iWord y iChar se multiplican por 200
    const filterFrequency = signal.wordIndexInBlock * 200;
    const oscillatorFrequency = signal.letterIndexInWord * 200;

    // Asegurar frecuencias mínimas audibles
    const minFreq = 50;
    const finalFilterFreq = Math.max(filterFrequency, minFreq);
    const finalOscFreq = Math.max(oscillatorFrequency, minFreq);

    // Aplicar las frecuencias
    this.lowPassFilter.frequency.rampTo(finalFilterFreq, 0.01);
    this.oscillator.frequency.rampTo(finalOscFreq, 0.01);

    // Disparar los envelopes (como el bang 'b' en PD)
    const now = Tone.now();
    this.envelope.triggerAttackRelease(this.envelopeTime, now);
    this.noiseEnvelope.triggerAttackRelease(this.envelopeTime, now);

    // console.log(`Audio: iWord=${signal.wordIndexInBlock} (filter: ${finalFilterFreq}Hz), iChar=${signal.letterIndexInWord} (osc: ${finalOscFreq}Hz)`);
  }

  /**
   * Reproduce un sonido de error
   */
  private playErrorSound(): void {
    // Sonido disonante para errores (no estaba en el patch original)
    // Usamos frecuencias bajas y disonantes
    this.oscillator.frequency.rampTo(50, 0.01);
    this.lowPassFilter.frequency.rampTo(100, 0.01);

    const now = Tone.now();
    this.envelope.triggerAttackRelease(0.2, now);
    this.noiseEnvelope.triggerAttackRelease(0.2, now);

    //console.log('Playing error sound');
  }

  /**
   * Cambia la configuración del motor de audio
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    // El volumen se controla con masterGain
    this.masterGain.gain.value = this.config.enabled ? 0.1 : 0;
  }

  /**
   * Habilita o deshabilita el audio
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.masterGain.gain.value = enabled ? 0.1 : 0;
  }

  /**
   * Limpia y libera recursos
   */
  dispose(): void {
    this.oscillator.stop();
    this.noise.stop();
    this.oscillator.dispose();
    this.noise.dispose();
    this.lowPassFilter.dispose();
    this.envelope.dispose();
    this.noiseEnvelope.dispose();
    this.masterGain.dispose();
  }
}

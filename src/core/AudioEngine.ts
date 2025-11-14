import * as Tone from 'tone';
import type { AudioSignal, AudioConfig } from '../types';

/**
 * AudioEngine - Enhanced version
 *
 * Motor de audio mejorado con múltiples modos de síntesis:
 * - Granular: Modo original (Pure Data inspired)
 * - Pentatonic: Escala pentatónica musical
 * - Harmonic: Serie armónica natural
 * - Microtonal: Escala microtonal exótica
 * - Ambient: Modo atmosférico con reverb y delay
 *
 * Incluye:
 * - Dinámica sensible a la velocidad de tecleado
 * - Audio espacial (panning estéreo)
 * - Efectos de reverb y delay
 * - Sonidos de error musicalmente interesantes
 */
export class AudioEngine {
  // Generadores principales
  private oscillator: Tone.Oscillator;
  private noise: Tone.Noise;
  private synth: Tone.PolySynth;

  // Filtros y procesadores
  private lowPassFilter: Tone.Filter;
  private envelope: Tone.AmplitudeEnvelope;
  private noiseEnvelope: Tone.AmplitudeEnvelope;

  // Efectos
  private reverb: Tone.Reverb;
  private delay: Tone.FeedbackDelay;
  private panner: Tone.Panner;

  // Mixing y salida
  private effectsChain: Tone.Gain;
  private masterGain: Tone.Gain;

  // Estado y configuración
  private config: AudioConfig;
  private isInitialized: boolean = false;
  private lastKeyPressTime: number = 0;

  // Escalas musicales
  private readonly pentatonicScale = [0, 2, 4, 7, 9]; // Pentatonic major
  private readonly harmonicSeries = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  private readonly microtonalScale = [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.5]; // Cuartos de tono

  // Envelope shape
  private readonly envelopeTime = 1.0;

  constructor(config?: Partial<AudioConfig>) {
    this.config = {
      volume: -10,
      enabled: true,
      noteDuration: '1n',
      baseOctave: 4,
      synthesisMode: 'granular',
      reverbEnabled: true,
      reverbAmount: 0.3,
      delayEnabled: false,
      delayAmount: 0.2,
      panningEnabled: true,
      ...config
    };

    // Crear sintetizador polifónico para modos musicales
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.3,
        release: 0.7
      }
    });

    // Oscilador sinusoidal para modo granular (osc~ 500 en PD)
    this.oscillator = new Tone.Oscillator({
      frequency: 500,
      type: 'sine'
    });

    // Ruido para modo granular (noise~ en PD)
    this.noise = new Tone.Noise('white');

    // Filtro low-pass para el ruido (lop~ en PD)
    this.lowPassFilter = new Tone.Filter({
      type: 'lowpass',
      frequency: 200,
      rolloff: -12
    });

    // Envelopes para modo granular
    this.envelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.7
    });

    this.noiseEnvelope = new Tone.AmplitudeEnvelope({
      attack: 0.01,
      decay: 0.3,
      sustain: 0.3,
      release: 0.7
    });

    // Efectos de audio
    this.reverb = new Tone.Reverb({
      decay: 3,
      preDelay: 0.01,
      wet: this.config.reverbAmount
    });

    this.delay = new Tone.FeedbackDelay({
      delayTime: '8n',
      feedback: 0.4,
      wet: this.config.delayAmount
    });

    this.panner = new Tone.Panner(0);

    // Ganancia para la cadena de efectos
    this.effectsChain = new Tone.Gain(1.0);

    // Ganancia master
    this.masterGain = new Tone.Gain(0.1);

    // Construir la cadena de audio
    // Modo granular: Ruido -> Filtro -> Envelope -> Efectos
    this.noise.connect(this.lowPassFilter);
    this.lowPassFilter.connect(this.noiseEnvelope);
    this.noiseEnvelope.connect(this.effectsChain);

    // Modo granular: Oscilador -> Envelope -> Efectos
    this.oscillator.connect(this.envelope);
    this.envelope.connect(this.effectsChain);

    // Modos musicales: Synth -> Efectos
    this.synth.connect(this.effectsChain);

    // Cadena de efectos: Efectos -> Panner -> Reverb -> Delay -> Master -> Output
    this.effectsChain.connect(this.panner);
    this.panner.connect(this.reverb);
    this.reverb.connect(this.delay);
    this.delay.connect(this.masterGain);
    this.masterGain.toDestination();

    // Iniciar generadores para modo granular
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
   * Soporta múltiples modos de síntesis y características avanzadas
   */
  processSignal(signal: AudioSignal): void {
    if (!this.config.enabled || !this.isInitialized) return;

    // Calcular velocidad de tecleado (para dinámica)
    const now = Date.now();
    const timeDelta = now - this.lastKeyPressTime;
    const velocity = this.calculateVelocity(timeDelta);
    this.lastKeyPressTime = now;

    // Calcular posición de panning basada en el progreso
    if (this.config.panningEnabled) {
      const panPosition = this.calculatePanning(signal);
      this.panner.pan.rampTo(panPosition, 0.05);
    }

    // Ajustar efectos basados en el progreso del bloque
    this.updateEffects(signal);

    // Procesar error o nota correcta
    if (signal.isError) {
      this.playErrorSound(signal, velocity);
    } else {
      this.playCorrectSound(signal, velocity);
    }
  }

  /**
   * Reproduce sonido para tecla correcta según el modo de síntesis
   */
  private playCorrectSound(signal: AudioSignal, velocity: number): void {
    const now = Tone.now();

    switch (this.config.synthesisMode) {
      case 'granular':
        this.playGranularSound(signal, velocity, now);
        break;

      case 'pentatonic':
        this.playPentatonicSound(signal, velocity, now);
        break;

      case 'harmonic':
        this.playHarmonicSound(signal, velocity, now);
        break;

      case 'microtonal':
        this.playMicrotonalSound(signal, velocity, now);
        break;

      case 'ambient':
        this.playAmbientSound(signal, velocity, now);
        break;
    }
  }

  /**
   * Modo granular (original Pure Data style)
   */
  private playGranularSound(signal: AudioSignal, velocity: number, now: number): void {
    const filterFrequency = signal.wordIndexInBlock * 200;
    const oscillatorFrequency = signal.letterIndexInWord * 200;

    const minFreq = 50;
    const finalFilterFreq = Math.max(filterFrequency, minFreq);
    const finalOscFreq = Math.max(oscillatorFrequency, minFreq);

    this.lowPassFilter.frequency.rampTo(finalFilterFreq, 0.01);
    this.oscillator.frequency.rampTo(finalOscFreq, 0.01);

    // Aplicar velocidad a la ganancia del envelope
    const envelopeGain = 0.5 + (velocity * 0.5);
    this.envelope.triggerAttackRelease(this.envelopeTime * envelopeGain, now);
    this.noiseEnvelope.triggerAttackRelease(this.envelopeTime * envelopeGain, now);
  }

  /**
   * Modo pentatónico - Escala musical pentatónica mayor
   */
  private playPentatonicSound(signal: AudioSignal, velocity: number, now: number): void {
    const scaleIndex = signal.letterIndexInWord % this.pentatonicScale.length;
    const octaveOffset = Math.floor(signal.wordIndexInBlock / 5);
    const octave = this.config.baseOctave + octaveOffset;

    const note = this.pentatonicScale[scaleIndex];
    const frequency = Tone.Frequency(note + octave * 12, 'midi').toFrequency();

    const duration = this.calculateDuration(velocity);
    const vol = -15 + (velocity * 10);

    this.synth.triggerAttackRelease(frequency, duration, now, Math.pow(10, vol / 20));
  }

  /**
   * Modo armónico - Serie armónica natural
   */
  private playHarmonicSound(signal: AudioSignal, velocity: number, now: number): void {
    const fundamentalFreq = 55; // A1
    const harmonicIndex = (signal.letterIndexInWord % this.harmonicSeries.length) + 1;
    const harmonic = this.harmonicSeries[harmonicIndex - 1];

    // Añadir modulación basada en la palabra
    const wordModulation = 1 + (signal.wordIndexInBlock * 0.05);
    const frequency = fundamentalFreq * harmonic * wordModulation;

    const duration = this.calculateDuration(velocity);
    const vol = -18 + (velocity * 12);

    this.synth.triggerAttackRelease(frequency, duration, now, Math.pow(10, vol / 20));
  }

  /**
   * Modo microtonal - Escala en cuartos de tono
   */
  private playMicrotonalSound(signal: AudioSignal, velocity: number, now: number): void {
    const scaleIndex = signal.letterIndexInWord % this.microtonalScale.length;
    const octaveOffset = Math.floor(signal.wordIndexInBlock / 4);
    const octave = this.config.baseOctave + octaveOffset;

    const semitones = this.microtonalScale[scaleIndex] + (octave * 12);
    const frequency = Tone.Frequency(semitones, 'midi').toFrequency();

    const duration = this.calculateDuration(velocity);
    const vol = -16 + (velocity * 10);

    this.synth.triggerAttackRelease(frequency, duration, now, Math.pow(10, vol / 20));
  }

  /**
   * Modo ambiental - Sonidos largos y atmosféricos
   */
  private playAmbientSound(signal: AudioSignal, velocity: number, now: number): void {
    const scaleIndex = signal.letterIndexInWord % this.pentatonicScale.length;
    const octave = this.config.baseOctave - 1; // Una octava más baja

    const note = this.pentatonicScale[scaleIndex];
    const frequency = Tone.Frequency(note + octave * 12, 'midi').toFrequency();

    // Duración mucho más larga para crear atmósfera
    const duration = '2n';
    const vol = -20 + (velocity * 8);

    this.synth.triggerAttackRelease(frequency, duration, now, Math.pow(10, vol / 20));
  }

  /**
   * Reproduce sonido para error - tonos disonantes pero musicales
   */
  private playErrorSound(_signal: AudioSignal, velocity: number): void {
    const now = Tone.now();

    // Usar un cluster de notas disonantes (segunda menor)
    const baseNote = 40; // E2
    const frequencies = [
      Tone.Frequency(baseNote, 'midi').toFrequency(),
      Tone.Frequency(baseNote + 1, 'midi').toFrequency(), // Semitono arriba
      Tone.Frequency(baseNote + 6, 'midi').toFrequency()  // Tritono (diablo en música)
    ];

    const duration = '16n';
    const vol = -12 + (velocity * 8);

    frequencies.forEach((freq, i) => {
      this.synth.triggerAttackRelease(freq, duration, now + (i * 0.02), Math.pow(10, vol / 20));
    });
  }

  /**
   * Calcula la velocidad basada en el tiempo entre teclas
   */
  private calculateVelocity(timeDelta: number): number {
    // Mapear tiempo entre teclas (ms) a velocidad (0-1)
    // Tecleo rápido (< 100ms) = velocidad alta
    // Tecleo lento (> 500ms) = velocidad baja
    const minTime = 50;
    const maxTime = 500;

    const normalized = Math.max(minTime, Math.min(timeDelta, maxTime));
    const velocity = 1 - ((normalized - minTime) / (maxTime - minTime));

    return velocity;
  }

  /**
   * Calcula la posición de panning basada en el progreso del texto
   */
  private calculatePanning(signal: AudioSignal): number {
    // Mapear posición en el bloque a panning (-1 a 1)
    const wordProgress = signal.wordIndexInBlock / signal.totalWordsInBlock;
    const letterProgress = signal.letterIndexInWord / signal.totalLettersInWord;

    // Combinar ambos para crear movimiento más interesante
    const pan = (wordProgress * 0.7) + (letterProgress * 0.3);

    // Mapear de 0-1 a -1 a 1
    return (pan * 2) - 1;
  }

  /**
   * Calcula la duración de la nota basada en la velocidad
   */
  private calculateDuration(velocity: number): string {
    // Velocidad alta = notas más cortas
    // Velocidad baja = notas más largas
    if (velocity > 0.8) return '16n';
    if (velocity > 0.6) return '8n';
    if (velocity > 0.4) return '4n';
    return '2n';
  }

  /**
   * Actualiza efectos basados en el progreso del bloque
   */
  private updateEffects(signal: AudioSignal): void {
    const blockProgress = signal.blockIndexInText / signal.totalBlocksInText;

    // Incrementar reverb según avanza el texto
    if (this.config.reverbEnabled) {
      const reverbWet = this.config.reverbAmount * (0.3 + (blockProgress * 0.7));
      this.reverb.wet.rampTo(reverbWet, 0.5);
    }

    // Incrementar delay según avanza el texto (solo si está habilitado)
    if (this.config.delayEnabled) {
      const delayWet = this.config.delayAmount * blockProgress;
      this.delay.wet.rampTo(delayWet, 0.5);
    }
  }

  /**
   * Cambia la configuración del motor de audio
   */
  updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };

    // Actualizar volumen
    if (config.volume !== undefined) {
      const gainValue = this.config.enabled ? Math.pow(10, config.volume / 20) : 0;
      this.masterGain.gain.rampTo(gainValue, 0.1);
    }

    // Actualizar reverb
    if (config.reverbEnabled !== undefined || config.reverbAmount !== undefined) {
      this.reverb.wet.rampTo(
        this.config.reverbEnabled ? this.config.reverbAmount : 0,
        0.5
      );
    }

    // Actualizar delay
    if (config.delayEnabled !== undefined || config.delayAmount !== undefined) {
      this.delay.wet.rampTo(
        this.config.delayEnabled ? this.config.delayAmount : 0,
        0.5
      );
    }

    // Cambiar modo de síntesis (instantáneo)
    if (config.synthesisMode !== undefined) {
      // El cambio de modo se aplica en el siguiente processSignal
    }

    // Actualizar panning
    if (config.panningEnabled !== undefined && !config.panningEnabled) {
      this.panner.pan.rampTo(0, 0.5); // Centrar si se deshabilita
    }
  }

  /**
   * Habilita o deshabilita el audio
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    const gainValue = enabled ? Math.pow(10, this.config.volume / 20) : 0;
    this.masterGain.gain.rampTo(gainValue, 0.1);
  }

  /**
   * Obtiene la configuración actual
   */
  getConfig(): AudioConfig {
    return { ...this.config };
  }

  /**
   * Limpia y libera recursos
   */
  dispose(): void {
    this.oscillator.stop();
    this.noise.stop();
    this.oscillator.dispose();
    this.noise.dispose();
    this.synth.dispose();
    this.lowPassFilter.dispose();
    this.envelope.dispose();
    this.noiseEnvelope.dispose();
    this.reverb.dispose();
    this.delay.dispose();
    this.panner.dispose();
    this.effectsChain.dispose();
    this.masterGain.dispose();
  }
}

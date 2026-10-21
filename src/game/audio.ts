// 100% Procedural Web Audio API Sound Synthesizer
// Ultra-realistic Indian soundscape with 2-stroke engine, dual-tone pressure horns,
// tire skid screech, suspension clunks, ambient street life, and 4-channel in-dash radio!

export type RadioStationId = 'off' | 'bollywood' | 'folk' | 'news' | 'devotional';

export interface RadioStationInfo {
  id: RadioStationId;
  name: string;
  frequency: string;
  genre: string;
  tagline: string;
}

export const RADIO_STATIONS: RadioStationInfo[] = [
  { id: 'off', name: 'Radio Off', frequency: '--.- FM', genre: 'Muted', tagline: 'Cassette deck idle' },
  { id: 'bollywood', name: 'Radio Mirchi Nostalgia', frequency: '98.3 FM', genre: 'Retro Bollywood', tagline: 'Kishore & Lata Classic Golden Melodies' },
  { id: 'folk', name: 'Desi Dholak & Bhangra Beats', frequency: '104.8 FM', genre: 'Punjabi & Rajasthani Folk', tagline: 'Energetic Punjabi Dholak & Tumbi Dhun' },
  { id: 'news', name: 'Akashvani Vividh Bharati', frequency: '102.6 FM', genre: 'National News & Bulletins', tagline: 'All India Radio Hourly Samachar Bulletin' },
  { id: 'devotional', name: 'Mandir Bhajan & Bansuri', frequency: '107.1 FM', genre: 'Spiritual Raga & Flute', tagline: 'Soothing Evening Santoor & Tanpura Raga' },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;

  // Engine Audio Nodes
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineOsc3: OscillatorNode | null = null;
  private engineSubNoise: AudioBufferSourceNode | null = null;
  private engineNoiseGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  // Tire Skid Sound
  private skidGain: GainNode | null = null;
  private skidFilter: BiquadFilterNode | null = null;
  private skidSource: AudioBufferSourceNode | null = null;
  private isSkidding: boolean = false;

  // Radio System
  public currentStation: RadioStationId = 'bollywood';
  private radioMasterGain: GainNode | null = null;
  private radioInterval: number | null = null;
  private radioBeatIndex: number = 0;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(muted ? 0 : 0.12, this.ctx.currentTime);
    }
    if (this.radioMasterGain && this.ctx) {
      this.radioMasterGain.gain.setValueAtTime(muted || this.currentStation === 'off' ? 0 : 0.18, this.ctx.currentTime);
    }
    if (muted && this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    } else if (!muted && this.currentStation !== 'off' && !this.radioInterval) {
      this.startRadioPlayback();
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  // =========================================================================
  // 1. ULTRA-REALISTIC 2-STROKE BAJAJ RE 175cc ENGINE
  // Features distinct piston putt-putt cadence, cylinder pressure sizzle,
  // high-RPM raspy exhaust whine, and overrun burble!
  // =========================================================================
  public startEngine() {
    if (this.isEngineRunning || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Primary cylinder pulse (sawtooth piston stroke)
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(26, now); // ~26 Hz idle throb

      // Second harmonic (crankcase resonance)
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(52, now);

      // Third rasp harmonic (metallic exhaust rattle)
      this.engineOsc3 = this.ctx.createOscillator();
      this.engineOsc3.type = 'sawtooth';
      this.engineOsc3.frequency.setValueAtTime(78, now);

      // 2-stroke exhaust crackle / pink noise puff buffer
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < noiseBuffer.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        output[i] = (b0 + b1 + b2) * 0.18;
      }
      this.engineSubNoise = this.ctx.createBufferSource();
      this.engineSubNoise.buffer = noiseBuffer;
      this.engineSubNoise.loop = true;

      this.engineNoiseGain = this.ctx.createGain();
      this.engineNoiseGain.gain.setValueAtTime(0.03, now);

      // Resonant tuned muffler filter
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(220, now);
      this.engineFilter.Q.setValueAtTime(4.2, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineOsc3.connect(this.engineFilter);

      this.engineSubNoise.connect(this.engineNoiseGain);
      this.engineNoiseGain.connect(this.engineFilter);

      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.engineOsc3.start(now);
      this.engineSubNoise.start(now);
      this.isEngineRunning = true;
    } catch {
      // AudioContext waiting on user action
    }
  }

  public updateEngineSound(speedRatio: number, throttle: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineOsc3 || !this.engineFilter || !this.engineGain) return;
    if (this.isMuted) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    const now = this.ctx.currentTime;
    // 2-stroke pitch ramps from 24 Hz idle to ~125 Hz top speed with extra rev when throttle is pinned
    const baseFreq = 24 + speedRatio * 90 + (throttle ? 18 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.0, now, 0.06);
    this.engineOsc3.frequency.setTargetAtTime(baseFreq * 3.0, now, 0.06);

    // Filter opens up during throttle for that iconic Bajaj RE raspy exhaust roar
    const filterCutoff = 200 + speedRatio * 900 + (throttle ? 350 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.07);

    const targetGain = Math.min(0.22, 0.07 + speedRatio * 0.12 + (throttle ? 0.035 : 0));
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);

    if (this.engineNoiseGain) {
      this.engineNoiseGain.gain.setTargetAtTime(0.02 + speedRatio * 0.06, now, 0.05);
    }
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc3?.stop();
      this.engineSubNoise?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
      this.engineOsc3?.disconnect();
      this.engineSubNoise?.disconnect();
    } catch {
      // Ignore
    }
    this.isEngineRunning = false;
  }

  // =========================================================================
  // 2. REALISTIC TIRE SKID & DRIFT SOUND (Asphalt Friction Screech)
  // =========================================================================
  public setSkidding(active: boolean, intensity = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (active && !this.isSkidding) {
      this.isSkidding = true;
      const bufferSize = this.ctx.sampleRate * 1.5;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }

      this.skidSource = this.ctx.createBufferSource();
      this.skidSource.buffer = noiseBuffer;
      this.skidSource.loop = true;

      this.skidFilter = this.ctx.createBiquadFilter();
      this.skidFilter.type = 'bandpass';
      this.skidFilter.frequency.setValueAtTime(1400, now);
      this.skidFilter.Q.setValueAtTime(4.5, now);

      this.skidGain = this.ctx.createGain();
      this.skidGain.gain.setValueAtTime(0.01, now);
      this.skidGain.gain.linearRampToValueAtTime(Math.min(0.25, intensity * 0.28), now + 0.05);

      this.skidSource.connect(this.skidFilter);
      this.skidFilter.connect(this.skidGain);
      this.skidGain.connect(this.ctx.destination);
      this.skidSource.start(now);
    } else if (active && this.isSkidding && this.skidGain) {
      this.skidGain.gain.setTargetAtTime(Math.min(0.28, intensity * 0.3), now, 0.04);
    } else if (!active && this.isSkidding && this.skidGain) {
      this.isSkidding = false;
      this.skidGain.gain.setTargetAtTime(0.001, now, 0.06);
      setTimeout(() => {
        try {
          this.skidSource?.stop();
          this.skidSource?.disconnect();
        } catch {
          // Ignore
        }
      }, 100);
    }
  }

  // =========================================================================
  // 3. SUSPENSION BUMP & POTHOLE IMPACT (Metallic Spring Thud)
  // =========================================================================
  public playSuspensionThud(intensity = 0.5) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const amp = Math.min(0.4, 0.15 + intensity * 0.25);
    gain.gain.setValueAtTime(amp, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);

    // Spring squeak
    if (intensity > 0.4) {
      const springOsc = this.ctx.createOscillator();
      const springGain = this.ctx.createGain();
      springOsc.type = 'sine';
      springOsc.frequency.setValueAtTime(800, now + 0.04);
      springOsc.frequency.linearRampToValueAtTime(1200, now + 0.09);
      springOsc.frequency.linearRampToValueAtTime(650, now + 0.16);
      springGain.gain.setValueAtTime(0.05, now + 0.04);
      springGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      springOsc.connect(springGain);
      springGain.connect(this.ctx.destination);
      springOsc.start(now + 0.04);
      springOsc.stop(now + 0.16);
    }
  }

  // =========================================================================
  // 4. ICONIC INDIAN DUAL-TONE MUSICAL HORN & BULB HORN
  // =========================================================================
  public playHorn(variant: 'airhorn' | 'bulb' = 'airhorn') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (variant === 'bulb') {
      // Classic rubber bulb squeeze horn: "Squee-Honk!"
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.35);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(680, now);
      filter.Q.setValueAtTime(3.0, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
      return;
    }

    // Default: Brassy dual-tone Indian electric pressure horn ("PO-POOO!")
    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.32, now);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    hornGain.connect(this.ctx.destination);

    const oscA = this.ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(440, now); // A4
    oscA.frequency.setValueAtTime(493.88, now + 0.14); // B4 pitch inflection

    const oscB = this.ctx.createOscillator();
    oscB.type = 'square';
    oscB.frequency.setValueAtTime(370, now); // F#4
    oscB.frequency.setValueAtTime(415.3, now + 0.14); // G#4

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1150, now);
    filter.Q.setValueAtTime(2.2, now);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(hornGain);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.58);
    oscB.stop(now + 0.58);
  }

  // =========================================================================
  // 5. IN-DASH INDIAN AUTO CASSETTE RADIO (4 REALISTIC PROCEDURAL STATIONS)
  // =========================================================================
  public setRadioStation(station: RadioStationId) {
    this.currentStation = station;
    this.playRadioTuningClick();

    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }

    if (station === 'off' || this.isMuted) return;

    this.startRadioPlayback();
  }

  public nextRadioStation(): RadioStationInfo {
    const ids: RadioStationId[] = ['off', 'bollywood', 'folk', 'news', 'devotional'];
    const currentIdx = ids.indexOf(this.currentStation);
    const nextIdx = (currentIdx + 1) % ids.length;
    this.setRadioStation(ids[nextIdx]);
    return RADIO_STATIONS.find((s) => s.id === ids[nextIdx])!;
  }

  private playRadioTuningClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Vintage mechanical dial click + brief RF static burst
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.35;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2200, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  private startRadioPlayback() {
    this.initCtx();
    if (!this.ctx || this.isMuted || this.currentStation === 'off') return;

    if (!this.radioMasterGain) {
      this.radioMasterGain = this.ctx.createGain();
      this.radioMasterGain.gain.setValueAtTime(0.16, this.ctx.currentTime);
      this.radioMasterGain.connect(this.ctx.destination);
    }

    this.radioBeatIndex = 0;

    // Station Specific Melodies & Rhythms
    if (this.currentStation === 'bollywood') {
      // Classic Bollywood Romance (Raga Yaman / Pahadi Melodic Line)
      // Notes: E4, G#4, A4, B4, C#5, E5, D#5
      const notes = [329.63, 415.3, 440.0, 493.88, 554.37, 659.25, 622.25, 493.88];
      const tablaFreqs = [95, 140, 180, 220]; // Dholak/Tabla thumps

      this.radioInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.currentStation !== 'bollywood') return;
        const now = this.ctx.currentTime;
        const step = this.radioBeatIndex % 8;
        this.radioBeatIndex++;

        // Sitar / Mandolin plucking note
        const noteFreq = notes[step];
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(noteFreq, now);

        noteGain.gain.setValueAtTime(0.001, now);
        noteGain.gain.linearRampToValueAtTime(0.14, now + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

        osc.connect(noteGain);
        noteGain.connect(this.radioMasterGain!);
        osc.start(now);
        osc.stop(now + 0.4);

        // Tabla Ghe / Dha on beats 0 and 4
        if (step === 0 || step === 4) {
          const tablaOsc = this.ctx.createOscillator();
          const tablaGain = this.ctx.createGain();
          tablaOsc.type = 'sine';
          tablaOsc.frequency.setValueAtTime(tablaFreqs[step === 0 ? 0 : 1], now);
          tablaOsc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

          tablaGain.gain.setValueAtTime(0.2, now);
          tablaGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          tablaOsc.connect(tablaGain);
          tablaGain.connect(this.radioMasterGain!);
          tablaOsc.start(now);
          tablaOsc.stop(now + 0.25);
        }
      }, 260); // 115 BPM groove

    } else if (this.currentStation === 'folk') {
      // Energetic Bhangra / Dholak Rhythm
      const tumbiNotes = [293.66, 329.63, 369.99, 440.0, 587.33]; // D, E, F#, A, D5
      this.radioInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.currentStation !== 'folk') return;
        const now = this.ctx.currentTime;
        const step = this.radioBeatIndex % 16;
        this.radioBeatIndex++;

        // Fast Tumbi one-string instrument pluck
        if (step % 2 === 0) {
          const tumbiOsc = this.ctx.createOscillator();
          const tumbiGain = this.ctx.createGain();
          tumbiOsc.type = 'sawtooth';
          tumbiOsc.frequency.setValueAtTime(tumbiNotes[(step / 2) % tumbiNotes.length], now);

          const filter = this.ctx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.setValueAtTime(1200, now);
          filter.Q.setValueAtTime(3.5, now);

          tumbiGain.gain.setValueAtTime(0.12, now);
          tumbiGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

          tumbiOsc.connect(filter);
          filter.connect(tumbiGain);
          tumbiGain.connect(this.radioMasterGain!);
          tumbiOsc.start(now);
          tumbiOsc.stop(now + 0.16);
        }

        // Heavy Dholak Dha bass thump on beats 0, 3, 6, 10
        if (step === 0 || step === 3 || step === 8 || step === 11) {
          const dholOsc = this.ctx.createOscillator();
          const dholGain = this.ctx.createGain();
          dholOsc.type = 'sine';
          dholOsc.frequency.setValueAtTime(step === 0 ? 110 : 130, now);
          dholOsc.frequency.exponentialRampToValueAtTime(40, now + 0.18);

          dholGain.gain.setValueAtTime(0.24, now);
          dholGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

          dholOsc.connect(dholGain);
          dholGain.connect(this.radioMasterGain!);
          dholOsc.start(now);
          dholOsc.stop(now + 0.2);
        }
      }, 140); // 214 BPM fast folk

    } else if (this.currentStation === 'news') {
      // Akashvani (All India Radio) Hourly Signature Chime & Hindi Broadcast cadence
      // Classic AIR pips: G5, C6, G5, C6
      const airPips = [783.99, 1046.5, 783.99, 1046.5];
      this.radioInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.currentStation !== 'news') return;
        const now = this.ctx.currentTime;
        const step = this.radioBeatIndex % 12;
        this.radioBeatIndex++;

        if (step < 4) {
          // Iconic Akashvani time pips
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(airPips[step], now);

          gain.gain.setValueAtTime(0.16, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

          osc.connect(gain);
          gain.connect(this.radioMasterGain!);
          osc.start(now);
          osc.stop(now + 0.25);
        } else {
          // Synthesized broadcast voice cadence (formant vowels)
          const voiceOsc = this.ctx.createOscillator();
          const voiceGain = this.ctx.createGain();
          const voiceFilter = this.ctx.createBiquadFilter();

          voiceOsc.type = 'sawtooth';
          const voicePitches = [160, 185, 175, 210, 165, 195, 155, 180];
          voiceOsc.frequency.setValueAtTime(voicePitches[step - 4], now);

          voiceFilter.type = 'bandpass';
          voiceFilter.frequency.setValueAtTime(step % 2 === 0 ? 800 : 1250, now);
          voiceFilter.Q.setValueAtTime(5.0, now);

          voiceGain.gain.setValueAtTime(0.06, now);
          voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

          voiceOsc.connect(voiceFilter);
          voiceFilter.connect(voiceGain);
          voiceGain.connect(this.radioMasterGain!);
          voiceOsc.start(now);
          voiceOsc.stop(now + 0.24);
        }
      }, 300);

    } else if (this.currentStation === 'devotional') {
      // Spiritual Santoor, Tanpura & Mandir Bells (Raga Bhairav / Shivranjani)
      const ragaNotes = [261.63, 293.66, 311.13, 392.0, 440.0, 523.25]; // C, D, Eb, G, A, C5
      this.radioInterval = window.setInterval(() => {
        if (!this.ctx || this.isMuted || this.currentStation !== 'devotional') return;
        const now = this.ctx.currentTime;
        const step = this.radioBeatIndex % 6;
        this.radioBeatIndex++;

        // Resonant Santoor Hammered Dulcimer note
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(ragaNotes[step], now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

        osc.connect(gain);
        gain.connect(this.radioMasterGain!);
        osc.start(now);
        osc.stop(now + 0.75);

        // Temple Brass Ghanti Bell on step 0
        if (step === 0) {
          const bell = this.ctx.createOscillator();
          const bellGain = this.ctx.createGain();
          bell.type = 'triangle';
          bell.frequency.setValueAtTime(1760, now); // High A6 bell
          bellGain.gain.setValueAtTime(0.18, now);
          bellGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
          bell.connect(bellGain);
          bellGain.connect(this.radioMasterGain!);
          bell.start(now);
          bell.stop(now + 1.1);
        }
      }, 420);
    }
  }

  // =========================================================================
  // 6. OTHER AUTHENTIC SOUNDS (Cutting Chai, Rupee Coins, Cow Moo, Crash)
  // =========================================================================
  public playChaiBoost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(1050, now + 0.42);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  }

  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fundamental = 1320;
    const harmonics = [1, 2.76, 5.4, 8.9];

    harmonics.forEach((h, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * (h / (idx === 0 ? 1 : 2.5)), now);

      const amp = 0.18 / (idx + 1);
      gain.gain.setValueAtTime(amp, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    });
  }

  public playPassengerSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  }

  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.32);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Procedural noise crunch
    const bufferSize = this.ctx.sampleRate * 0.22;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now);
  }

  public playCowMoo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);
    osc.frequency.linearRampToValueAtTime(105, now + 0.75);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(460, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.22, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.78);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.78);
  }

  // Heavy rural tractor klaxon horn
  public playTractorHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(196, now); // Low G3
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(247, now); // B3

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.65);
    osc2.stop(now + 0.65);
  }

  // Sharp 2-stroke rival auto-rickshaw horn ("PEEP-PEEP!")
  public playRivalAutoHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Two rapid sharp beeps
    [0, 0.14].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(620, now + offset);
      osc.frequency.setValueAtTime(698, now + offset + 0.04);

      gain.gain.setValueAtTime(0.22, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now + offset);
      filter.Q.setValueAtTime(3.5, now + offset);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.1);
    });
  }

  // Rewarding near-miss whoosh chime
  public playNearMissBonus() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // =========================================================================
  // WEATHER SOUNDS (Monsoon Rain, Thunder, Dusty Wind)
  // =========================================================================
  private rainSource: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private isRainPlaying: boolean = false;

  public setRainAudio(active: boolean) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    if (active && !this.isRainPlaying) {
      this.isRainPlaying = true;
      const bufferSize = this.ctx.sampleRate * 2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.4;
      }
      this.rainSource = this.ctx.createBufferSource();
      this.rainSource.buffer = buffer;
      this.rainSource.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);

      this.rainGain = this.ctx.createGain();
      this.rainGain.gain.setValueAtTime(0.01, now);
      this.rainGain.gain.linearRampToValueAtTime(0.18, now + 0.4);

      this.rainSource.connect(filter);
      filter.connect(this.rainGain);
      this.rainGain.connect(this.ctx.destination);
      this.rainSource.start(now);
    } else if (!active && this.isRainPlaying && this.rainGain) {
      this.isRainPlaying = false;
      this.rainGain.gain.setTargetAtTime(0.001, now, 0.2);
      setTimeout(() => {
        try {
          this.rainSource?.stop();
          this.rainSource?.disconnect();
        } catch {}
      }, 300);
    }
  }

  public playThunder() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(240, now);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.4);
  }

  // Dynamic Puddle Splash water whoosh
  public playPuddleSplash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.45);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.45;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.linearRampToValueAtTime(1400, now + 0.1);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    noise.start(now);
  }

  // Wet Tarmac Aquaplane Loss of Grip Hiss
  public playAquaplaneSkid() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(680, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.35);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(4.5, now);

    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Brake Lockup Skid on Wet / Sandy Road
  public playBrakeLockup() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.4);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // Heavy Desert Wind Buffeting Whoosh
  public playWindGust() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(70, now + 0.9);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.25, now + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.9);
  }

  // Heavy Indian State Transport Bus Pneumatic Air Horn ("BHOOON-BHOOON!")
  public playBusAirHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const oscA = this.ctx.createOscillator();
    const oscB = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(220, now); // A3
    oscB.type = 'sawtooth';
    oscB.frequency.setValueAtTime(277.18, now); // C#4

    gain.gain.setValueAtTime(0.34, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(950, now);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.85);
    oscB.stop(now + 0.85);
  }

  // Classic Indian Cycle Rickshaw Brass Bell ("Trin-Trin!")
  public playCycleRickshawBell() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093, now + offset); // C7 high bell chime

      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.22);
    });
  }

  // =========================================================================
  // CHAI BREAK PREPARATION SOUNDS
  // =========================================================================
  public playChaiPreparationStep(step: 'mortar' | 'boil' | 'pour' | 'sip') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (step === 'mortar') {
      // Rhythmic ginger & cardamom brass mortar thumps
      [0, 0.14, 0.28].forEach((offset) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now + offset);
        osc.frequency.exponentialRampToValueAtTime(90, now + offset + 0.08);

        gain.gain.setValueAtTime(0.24, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.1);
      });
    } else if (step === 'boil') {
      // Sizzling bubbling hot spiced milk tea
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.linearRampToValueAtTime(620, now + 0.5);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (step === 'pour') {
      // Liquid pouring sound stream into Kulhad
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.8);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(1400, now + 0.7);
      filter.Q.setValueAtTime(3.0, now);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } else if (step === 'sip') {
      // Refreshing tea slurp & kulhad clink
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, now); // C6 kulhad clink
      osc.frequency.exponentialRampToValueAtTime(2093, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  }

  public playMissionComplete() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.25, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.45);
    });

    const bellOsc = this.ctx.createOscillator();
    const bellGain = this.ctx.createGain();
    bellOsc.type = 'triangle';
    bellOsc.frequency.setValueAtTime(880, now + 0.2);
    bellGain.gain.setValueAtTime(0.3, now + 0.2);
    bellGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    bellOsc.connect(bellGain);
    bellGain.connect(this.ctx.destination);
    bellOsc.start(now + 0.2);
    bellOsc.stop(now + 1.2);
  }

  public startAmbientRaga() {
    // If radio is playing, keep radio. Otherwise start Bollywood radio by default
    if (this.currentStation !== 'off') {
      this.startRadioPlayback();
    }
  }

  public stopAmbientRaga() {
    if (this.radioInterval) {
      clearInterval(this.radioInterval);
      this.radioInterval = null;
    }
  }

  // =========================================================================
  // 10. REALISTIC IN-GAME PHONE AUDIO (DTMF, RINGTONE, RINGBACK, VOIP)
  // =========================================================================
  private phoneRingtoneInterval: number | null = null;

  public playDtmf(key: string) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Standard ITU-T DTMF dual-tone frequencies
    const dtmfFreqs: Record<string, [number, number]> = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
    };

    const freqs = dtmfFreqs[key] || [770, 1336];
    const now = this.ctx.currentTime;
    const dur = 0.12;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    gain.connect(this.ctx.destination);

    freqs.forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + dur);
    });
  }

  public playRingbackTone() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Standard ringback 400Hz + 450Hz
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + 0.4);
    gain.gain.setValueAtTime(0, now + 0.55);
    gain.gain.setValueAtTime(0.12, now + 0.75);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    gain.connect(this.ctx.destination);

    [400, 450].forEach((freq) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 1.25);
    });
  }

  public playPhoneRingtone() {
    this.stopPhoneRingtone();
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Classic catchy Indian polyphonic caller tune / ringtone melody
    const ringNotes = [
      { f: 587.33, d: 0.12 }, // D5
      { f: 659.25, d: 0.12 }, // E5
      { f: 783.99, d: 0.2 },  // G5
      { f: 880.00, d: 0.15 }, // A5
      { f: 987.77, d: 0.25 }, // B5
      { f: 880.00, d: 0.15 }, // A5
      { f: 783.99, d: 0.3 },  // G5
    ];

    const playCycle = () => {
      if (this.isMuted || !this.ctx) return;
      let offset = 0;
      const now = this.ctx.currentTime;

      ringNotes.forEach((item) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now + offset);

        gain.gain.setValueAtTime(0.16, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + item.d * 0.95);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + item.d);
        offset += item.d + 0.04;
      });
    };

    playCycle();
    this.phoneRingtoneInterval = window.setInterval(playCycle, 2400);
  }

  public stopPhoneRingtone() {
    if (this.phoneRingtoneInterval) {
      clearInterval(this.phoneRingtoneInterval);
      this.phoneRingtoneInterval = null;
    }
  }

  public playCallConnected() {
    if (this.isMuted) return;
    this.stopPhoneRingtone();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCallHangup() {
    if (this.isMuted) return;
    this.stopPhoneRingtone();
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // 3 rapid disconnect beeps (480Hz)
    [0, 0.18, 0.36].forEach((timeOffset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(480, now + timeOffset);

      gain.gain.setValueAtTime(0.12, now + timeOffset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + timeOffset + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + timeOffset);
      osc.stop(now + timeOffset + 0.12);
    });
  }

  public playPhoneClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.03);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playRepairWrench() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Metallic wrench clank + ratcheting clicks
    [0, 0.08, 0.16, 0.26].forEach((t, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + i * 180, now + t);
      osc.frequency.exponentialRampToValueAtTime(240, now + t + 0.06);

      gain.gain.setValueAtTime(0.22, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.07);
    });
  }
}

export const sounds = new SoundEngine();

// 100% Procedural Web Audio API Sound Synthesizer
// Zero external mp3/wav files required

class SoundEngine {
  private ctx: AudioContext | null = null;
  public isMuted: boolean = false;
  private engineGain: GainNode | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;
  private bgmInterval: number | null = null;
  private isBgmPlaying: boolean = false;

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
    if (muted && this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.isBgmPlaying = false;
    }
  }

  public toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  // --- Real 2-Stroke Auto Rickshaw Engine (Bajaj RE 175cc) ---
  public startEngine() {
    if (this.isEngineRunning || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Dual sawtooth + triangle pulse for signature 2-stroke "putt-putt-putt"
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(32, now);

      this.engineOsc2 = this.ctx.createOscillator();
      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(64, now);

      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, now);
      this.engineFilter.Q.setValueAtTime(3.5, now);

      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.08, now);

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.isEngineRunning = true;
    } catch {
      // AudioContext might still be restricted before user gesture
    }
  }

  public updateEngineSound(speedRatio: number, throttle: boolean) {
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;
    if (this.isMuted) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    const now = this.ctx.currentTime;
    const baseFreq = 30 + speedRatio * 85 + (throttle ? 12 : 0);
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, now, 0.08);

    const filterCutoff = 220 + speedRatio * 800 + (throttle ? 250 : 0);
    this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.08);

    const targetGain = Math.min(0.2, 0.07 + speedRatio * 0.12 + (throttle ? 0.03 : 0));
    this.engineGain.gain.setTargetAtTime(targetGain, now, 0.05);
  }

  public stopEngine() {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc1?.stop();
      this.engineOsc2?.stop();
      this.engineOsc1?.disconnect();
      this.engineOsc2?.disconnect();
    } catch {
      // Ignore
    }
    this.isEngineRunning = false;
  }

  // --- Iconic Indian Dual-Tone Horn ("PO-POOO!") ---
  public playHorn() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const hornGain = this.ctx.createGain();
    hornGain.gain.setValueAtTime(0.3, now);
    hornGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    hornGain.connect(this.ctx.destination);

    // Two tuned square/saw oscillators for brassy electric Indian pressure horn
    const oscA = this.ctx.createOscillator();
    oscA.type = 'sawtooth';
    oscA.frequency.setValueAtTime(420, now);
    oscA.frequency.setValueAtTime(466.16, now + 0.12); // Bb4 note jump

    const oscB = this.ctx.createOscillator();
    oscB.type = 'square';
    oscB.frequency.setValueAtTime(350, now);
    oscB.frequency.setValueAtTime(392, now + 0.12); // G4

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1100, now);
    filter.Q.setValueAtTime(2.0, now);

    oscA.connect(filter);
    oscB.connect(filter);
    filter.connect(hornGain);

    oscA.start(now);
    oscB.start(now);
    oscA.stop(now + 0.55);
    oscB.stop(now + 0.55);
  }

  // --- Cutting Chai / Masala Boost Sound (Boiling hiss + energy woosh) ---
  public playChaiBoost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.4);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  // --- Rupee Coin Collect Sound (Temple Brass Bell / Ghanti Chime) ---
  public playCoin() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const fundamental = 1320; // High resonant E6 chime
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

  // --- Passenger Pickup / Drop Chime ("Meter Down" Click + Joyful Jingle) ---
  public playPassengerSuccess() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Arpeggiated cheerful Indian notes (Sa - Ga - Pa - Sa)
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

  // --- Crash / Pothole Thud Sound ---
  public playCrash() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Low frequency crunch impact
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);

    // Procedural noise burst for metal shudder
    const bufferSize = this.ctx.sampleRate * 0.2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.25, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
  }

  // --- Gentle Cow "Moo" when honking near Gau Mata ---
  public playCowMoo() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    // Classic formantic moo inflection
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);
    osc.frequency.linearRampToValueAtTime(110, now + 0.7);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(4.0, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.2, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.75);
  }

  // --- Procedural Indian Highway Ambience / Raga Music ---
  public startAmbientRaga() {
    if (this.isBgmPlaying || this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;
    this.isBgmPlaying = true;

    // Raga Bhupali / Desi Pentatonic Scale notes: C#4, D#4, F4, G#4, A#4
    const ragaNotes = [277.18, 311.13, 349.23, 415.30, 466.16, 554.37];
    let noteIndex = 0;

    this.bgmInterval = window.setInterval(() => {
      if (this.isMuted || !this.ctx || !this.isBgmPlaying) return;
      const now = this.ctx.currentTime;
      // Gentle flute tone
      const freq = ragaNotes[(noteIndex + Math.floor(Math.random() * 3)) % ragaNotes.length];
      noteIndex++;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.7);
    }, 450);
  }

  public stopAmbientRaga() {
    if (this.bgmInterval) {
      clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
    this.isBgmPlaying = false;
  }
}

export const sounds = new SoundEngine();

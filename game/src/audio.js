// audio.js — one job: every sound, synthesised in WebAudio. No audio
// files, no network. Silent until the first key press or click.
export class SoundBank {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.master = null;
  }

  ensure() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
      return;
    }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  tone(freq, dur, type = 'sine', vol = 1, slideTo = null, delay = 0) {
    if (!this.ctx || this.muted) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.05);
    } catch {
      // Audio is decoration; a failure here must never break the game.
    }
  }

  // Soft cloth step, lower when sneaking.
  step(sneaking) {
    this.tone(sneaking ? 140 : 95, 0.07, 'triangle', sneaking ? 0.25 : 0.5, 60);
  }

  pebble() {
    this.tone(620, 0.06, 'square', 0.25, 300);
    this.tone(880, 0.09, 'sine', 0.2, 500, 0.12);
  }

  suspicious() {
    this.tone(330, 0.16, 'sine', 0.5, 392);
  }

  alert() {
    this.tone(220, 0.22, 'sawtooth', 0.4, 440);
    this.tone(440, 0.22, 'sawtooth', 0.3, 660, 0.14);
  }

  sealPickup() {
    this.tone(523, 0.14, 'sine', 0.5);
    this.tone(659, 0.14, 'sine', 0.5, null, 0.1);
    this.tone(784, 0.3, 'sine', 0.55, null, 0.2);
  }

  caught() {
    this.tone(196, 0.5, 'sawtooth', 0.5, 98);
    this.tone(147, 0.7, 'sawtooth', 0.4, 73, 0.18);
  }

  win() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.4, 'sine', 0.5, null, i * 0.12));
  }
}

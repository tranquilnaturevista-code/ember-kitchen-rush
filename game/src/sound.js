// sound.js — one clear job: every sound the game makes, synthesized with the
// Web Audio API so the game ships no audio files. The context is created on
// the first user gesture (browsers block audio before that) and every call
// before then is a silent no-op.

export function createSound() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext ?? window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      return null;
    }
    return context;
  }

  function tone(frequency, duration, type = 'sine', gainValue = 0.12, when = 0) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(gainValue, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  /** A short burst of filtered noise: the wok sizzling. */
  function sizzle() {
    const ctx = ensure();
    if (!ctx || muted) return;
    const length = Math.floor(ctx.sampleRate * 0.5);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1800;
    const gain = ctx.createGain();
    gain.gain.value = 0.18;
    source.connect(filter).connect(gain).connect(ctx.destination);
    source.start();
  }

  return {
    unlock() {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    add() {
      tone(520, 0.08, 'triangle', 0.1);
    },
    sizzle,
    cooking() {
      sizzle();
    },
    cooked() {
      tone(880, 0.12, 'sine', 0.14);
      tone(1318, 0.18, 'sine', 0.12, 0.1);
    },
    served() {
      tone(659, 0.1, 'triangle', 0.14);
      tone(880, 0.1, 'triangle', 0.14, 0.08);
      tone(1174, 0.22, 'triangle', 0.14, 0.16);
    },
    expired() {
      tone(220, 0.25, 'sawtooth', 0.08);
      tone(165, 0.3, 'sawtooth', 0.08, 0.12);
    },
    click() {
      tone(700, 0.05, 'square', 0.05);
    },
  };
}

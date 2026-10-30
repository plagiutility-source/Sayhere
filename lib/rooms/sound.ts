"use client";

/**
 * The order bell and alert ring (spec section 6).
 *
 * Bell: 880 Hz triangle, then 1174.66 Hz and 1567.98 Hz sine; 0.16 s apart;
 * gain 0.22 / 0.12 / 0.12; decay 0.65 s.
 * Ring: plays at 0, 2, 4, 6 and 8 seconds, then stops after the 10 s window.
 * Both are silent when the owner has muted the bell.
 */

import {
  ALERT_RING_INTERVAL_MS,
  ALERT_RING_WINDOW_MS,
  BELL_DECAY_SECONDS,
  BELL_STEP_SECONDS,
  BELL_TONES,
} from "./constants";

type AudioContextCtor = new () => AudioContext;

let audioContext: AudioContext | null = null;

export function playBell(soundOn: boolean): void {
  if (!soundOn) return;
  try {
    if (typeof window === "undefined") return;
    const AudioCtor = (window.AudioContext ||
      (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext) as
      | AudioContextCtor
      | undefined;
    if (!AudioCtor) return;
    audioContext = audioContext || new AudioCtor();
    if (audioContext.state === "suspended") void audioContext.resume();
    const start = audioContext.currentTime + 0.02;
    BELL_TONES.forEach((tone, index) => {
      if (!audioContext) return;
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = tone.type;
      oscillator.frequency.value = tone.frequency;
      const at = start + index * BELL_STEP_SECONDS;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(tone.gain, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + BELL_DECAY_SECONDS);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(at);
      oscillator.stop(at + 0.7);
    });
  } catch {
    /* Browsers can block audio until the owner interacts with the page. */
  }
}

export type AlertRing = { stop: () => void };

/** New orders ring immediately, then every two seconds for ten seconds. */
export function startAlertRing(soundOn: boolean): AlertRing {
  let active = true;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const startedAt = Date.now();

  const stop = () => {
    active = false;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const ring = () => {
    if (!active) return;
    if (Date.now() - startedAt >= ALERT_RING_WINDOW_MS) {
      stop();
      return;
    }
    playBell(soundOn);
    timer = setTimeout(ring, ALERT_RING_INTERVAL_MS);
  };

  if (!soundOn) return { stop };
  ring();
  return { stop };
}

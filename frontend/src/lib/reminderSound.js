// Audio Engine for Reminders and Global Alerts in LyangPOS
import { speakVi } from './utils';

let reminderAudioCtx = null;

const getReminderAudioContext = () => {
  if (!reminderAudioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      reminderAudioCtx = new AudioContextClass();
    }
  }
  if (reminderAudioCtx && reminderAudioCtx.state === 'suspended') {
    reminderAudioCtx.resume();
  }
  return reminderAudioCtx;
};

export const playToneFrequency = (ctx, freq, startTime, duration, volume = 0.3, type = 'sine') => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration);
};

/**
 * Play sound based on sound theme profile:
 * - 'bell' (Classic 3-tone notification chime)
 * - 'chime' (Elegant cascading crystal chime)
 * - 'urgent' (High-visibility alarm pulse)
 * - 'gentle' (Soft warm harp tone)
 * - 'tts' (Voice synthesis announcement)
 */
export const playReminderSound = async (theme = 'bell', customTitle = '', customMessage = '') => {
  // Check if system mute is active
  if (localStorage.getItem('pos_lite_sounds_muted') === 'true') return;
  if (localStorage.getItem('pos_notifications_muted') === 'true') return;

  const ctx = getReminderAudioContext();

  if (theme === 'bell') {
    // 3-tone harmonic bell: C5 -> E5 -> G5
    if (ctx) {
      const now = ctx.currentTime;
      playToneFrequency(ctx, 523.25, now, 0.4, 0.28, 'sine');          // C5
      playToneFrequency(ctx, 659.25, now + 0.15, 0.45, 0.3, 'sine');   // E5
      playToneFrequency(ctx, 783.99, now + 0.32, 0.9, 0.35, 'sine');    // G5
      playToneFrequency(ctx, 1046.50, now + 0.32, 0.7, 0.15, 'triangle'); // C6 sparkle
    }
  } else if (theme === 'chime') {
    // Crystal cascade chime: A4 -> C#5 -> E5 -> A5
    if (ctx) {
      const now = ctx.currentTime;
      playToneFrequency(ctx, 440.00, now, 0.3, 0.2, 'sine');
      playToneFrequency(ctx, 554.37, now + 0.1, 0.35, 0.22, 'sine');
      playToneFrequency(ctx, 659.25, now + 0.2, 0.4, 0.25, 'sine');
      playToneFrequency(ctx, 880.00, now + 0.3, 0.8, 0.3, 'sine');
    }
  } else if (theme === 'urgent') {
    // 3 rapid pulses of dual-tone alarm
    if (ctx) {
      const now = ctx.currentTime;
      for (let i = 0; i < 3; i++) {
        const offset = i * 0.22;
        playToneFrequency(ctx, 880.00, now + offset, 0.12, 0.35, 'sawtooth');
        playToneFrequency(ctx, 1174.66, now + offset + 0.05, 0.12, 0.3, 'sine');
      }
    }
  } else if (theme === 'gentle') {
    // Soft soothing warm tone (marimba-like)
    if (ctx) {
      const now = ctx.currentTime;
      playToneFrequency(ctx, 392.00, now, 0.6, 0.25, 'triangle');       // G4
      playToneFrequency(ctx, 493.88, now + 0.18, 0.8, 0.28, 'triangle'); // B4
      playToneFrequency(ctx, 587.33, now + 0.36, 1.2, 0.3, 'sine');      // D5
    }
  } else if (theme === 'tts') {
    // Play a gentle intro chime, then speak the reminder title/message
    if (ctx) {
      const now = ctx.currentTime;
      playToneFrequency(ctx, 587.33, now, 0.25, 0.25, 'sine');
      playToneFrequency(ctx, 880.00, now + 0.12, 0.4, 0.3, 'sine');
    }

    const speechText = customMessage || (customTitle ? `Có nhắc nhở: ${customTitle}` : 'Có thông báo nhắc nhở đến hạn');
    setTimeout(() => {
      try {
        speakVi(speechText);
      } catch (e) {
        console.warn('TTS reminder voice error:', e);
      }
    }, 450);
  } else {
    // Default fallback bell
    if (ctx) {
      const now = ctx.currentTime;
      playToneFrequency(ctx, 523.25, now, 0.4, 0.28, 'sine');
      playToneFrequency(ctx, 659.25, now + 0.15, 0.45, 0.3, 'sine');
      playToneFrequency(ctx, 783.99, now + 0.32, 0.9, 0.35, 'sine');
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// SQUARE WAVE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Hollow, woody square wave - classic video game and chiptune sound
//
// SIGNAL FLOW:
//   Frequency Control → Band-Limited Square → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses os.square() from standard library
//   Implements band-limited square wave to prevent aliasing
//   50% duty cycle (equal high/low periods)
//
// HARMONIC CONTENT:
//   Contains only ODD harmonics (1, 3, 5, 7, 9...)
//   Harmonic amplitude decreases at 1/n (same as sawtooth)
//   Missing even harmonics create "hollow" timbre
//
// USE CASES:
//   - Chiptune/8-bit music
//   - Clarinet-like tones (lower register)
//   - Sub-bass with presence
//   - Retro game sound effects
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 220, 20, 20000, 0.1);
gain = hslider("[1]Amplitude", 0.3, 0, 1, 0.01);  // Lower default (bright sound)

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

square_wave = os.square(freq) * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = square_wave;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Frequency Range: 20 Hz - 20 kHz
// Amplitude Range: 0.0 - 1.0 (default lower due to brightness)
// Waveform: Symmetric square (50% duty cycle)
// Duty Cycle: Fixed at 50% (equal high/low time)
// Harmonics: Odd only (1st, 3rd, 5th, 7th...)
// Anti-Aliasing: Band-limited implementation
//
// HARMONIC SERIES EXAMPLE (220 Hz):
//   Fundamental: 220 Hz (amplitude = 1.0)
//   2nd harmonic: MISSING (creates hollow sound)
//   3rd harmonic: 660 Hz (amplitude = 0.33)
//   4th harmonic: MISSING
//   5th harmonic: 1100 Hz (amplitude = 0.2)
//   7th harmonic: 1540 Hz (amplitude = 0.14)
//   ... only odd harmonics to Nyquist
//
// COMPARISON TO PULSE WAVE:
//   Square wave is a special case of pulse wave with 50% duty cycle
//   For variable duty cycle, use os.pulsetrain() instead
//
// ═══════════════════════════════════════════════════════════════════════════

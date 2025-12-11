// ═══════════════════════════════════════════════════════════════════════════
// SAWTOOTH WAVE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Bright, harmonic-rich sawtooth wave - classic analog synthesizer sound
//
// SIGNAL FLOW:
//   Frequency Control → Band-Limited Sawtooth → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses os.sawtooth() which implements PolyBLEP (Polynomial Band-Limited Step)
//   algorithm to minimize aliasing artifacts at all frequencies
//
// HARMONIC CONTENT:
//   Contains all harmonics (1, 2, 3, 4, 5...)
//   Harmonic amplitude decreases at 1/n (6 dB/octave)
//   Perceived as "bright" and "buzzy"
//
// USE CASES:
//   - Lead synthesizer sounds
//   - Bass synthesis
//   - Subtractive synthesis raw material
//   - Vintage analog emulation
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 110, 20, 20000, 0.1);
gain = hslider("[1]Amplitude", 0.3, 0, 1, 0.01);  // Lower default (bright sound)

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

sawtooth_wave = os.sawtooth(freq) * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = sawtooth_wave;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Frequency Range: 20 Hz - 20 kHz
// Amplitude Range: 0.0 - 1.0 (default lower due to brightness)
// Waveform: Linear ramp (rising sawtooth)
// Harmonics: All integer multiples of fundamental
// Anti-Aliasing: PolyBLEP algorithm reduces high-frequency artifacts
// Peak-to-RMS Ratio: ~1.73 (5.8 dB) - perceived louder than sine
//
// HARMONIC SERIES EXAMPLE (440 Hz):
//   Fundamental: 440 Hz (amplitude = 1.0)
//   2nd harmonic: 880 Hz (amplitude = 0.5)
//   3rd harmonic: 1320 Hz (amplitude = 0.33)
//   4th harmonic: 1760 Hz (amplitude = 0.25)
//   ... continues to Nyquist frequency
//
// ═══════════════════════════════════════════════════════════════════════════

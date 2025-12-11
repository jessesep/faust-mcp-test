// ═══════════════════════════════════════════════════════════════════════════
// TRIANGLE WAVE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Soft, flute-like triangle wave - mellow alternative to sawtooth/square
//
// SIGNAL FLOW:
//   Frequency Control → Band-Limited Triangle → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses os.triangle() from standard library
//   Mathematically: integrated square wave
//   Creates smoother sound than square due to gentler harmonics rolloff
//
// HARMONIC CONTENT:
//   Contains only ODD harmonics (like square wave)
//   BUT: Harmonic amplitude decreases at 1/n² (12 dB/octave)
//   Much faster rolloff = softer, more mellow timbre
//
// USE CASES:
//   - Flute-like synthesis
//   - Soft pad sounds
//   - Sub-bass (smoother than square)
//   - Musical box/toy piano tones
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 440, 20, 20000, 0.1);
gain = hslider("[1]Amplitude", 0.5, 0, 1, 0.01);  // Can be higher (softer sound)

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

triangle_wave = os.triangle(freq) * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = triangle_wave;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Frequency Range: 20 Hz - 20 kHz
// Amplitude Range: 0.0 - 1.0 (can use higher gain than saw/square)
// Waveform: Symmetric triangle (linear rise and fall)
// Harmonics: Odd only, rapidly decreasing
// Anti-Aliasing: Band-limited implementation
//
// HARMONIC SERIES EXAMPLE (440 Hz):
//   Fundamental: 440 Hz (amplitude = 1.0)
//   2nd harmonic: MISSING
//   3rd harmonic: 1320 Hz (amplitude = 0.11)  ← 1/9 of fundamental
//   4th harmonic: MISSING
//   5th harmonic: 2200 Hz (amplitude = 0.04)  ← 1/25 of fundamental
//   7th harmonic: 3080 Hz (amplitude = 0.02)  ← 1/49 of fundamental
//   ... rapidly approaches zero
//
// TIMBRAL CHARACTER:
//   - Softer than square wave (faster harmonic rolloff)
//   - Hollow like square (odd harmonics only)
//   - Approaching sine wave (but with subtle edge)
//   - Peak-to-RMS: Similar to sine (~1.4)
//
// MATHEMATICAL RELATIONSHIP:
//   Triangle = Integrated Square
//   Square = Differentiated Triangle
//
// ═══════════════════════════════════════════════════════════════════════════

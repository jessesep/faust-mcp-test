// ═══════════════════════════════════════════════════════════════════════════
// WHITE NOISE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Pure white noise - equal energy across all frequencies
//
// SIGNAL FLOW:
//   Random Generator → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses no.noise() from standard library
//   Generates pseudo-random samples uniformly distributed between -1 and +1
//   Each sample is independent (no correlation)
//
// SPECTRAL CONTENT:
//   Equal power per Hz across entire frequency spectrum
//   Flat frequency response up to Nyquist frequency
//   Sounds like "static" or "hiss"
//
// USE CASES:
//   - Percussion synthesis (snare, hi-hat, cymbal)
//   - Wind/ocean sound effects
//   - Signal testing and calibration
//   - Subtractive synthesis raw material
//   - Noise gates and expanders test signal
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

gain = hslider("[0]Amplitude", 0.2, 0, 1, 0.01);  // Low default (can be harsh)

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

white_noise = no.noise * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = white_noise;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Amplitude Range: 0.0 - 1.0 (use low values to avoid fatigue)
// Frequency Content: DC to Nyquist (0 Hz to sample_rate/2)
// Probability Distribution: Uniform random
// Amplitude Distribution: Gaussian (normal distribution)
// Crest Factor: Very high (~12 dB) - occasional loud peaks
//
// SPECTRAL CHARACTERISTICS:
//   - Flat spectrum (equal power per Hz)
//   - At 44.1 kHz: contains frequencies from 0-22.05 kHz
//   - At 48 kHz: contains frequencies from 0-24 kHz
//   - No harmonic structure (aperiodic signal)
//
// PERCEPTUAL NOTES:
//   - Sounds "bright" and "harsh" (high-frequency energy)
//   - Can mask other sounds effectively
//   - Extended listening can cause ear fatigue
//   - Use conservative gain levels
//
// RELATED NOISE TYPES:
//   - Pink noise: -3 dB/octave rolloff (equal energy per octave)
//   - Brown/Red noise: -6 dB/octave rolloff (darker than pink)
//   - Blue noise: +3 dB/octave (brighter than white)
//
// SYNTHESIS APPLICATIONS:
//   Filter white noise through lowpass → wind sounds
//   Filter through bandpass → ocean waves
//   Short burst through filter → percussion (snare, hi-hat)
//   Envelope + resonant filter → 808-style hi-hats
//
// ═══════════════════════════════════════════════════════════════════════════

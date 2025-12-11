// ═══════════════════════════════════════════════════════════════════════════
// SINE WAVE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Pure sine wave generator - the fundamental building block of synthesis
//
// SIGNAL FLOW:
//   Frequency Control → Oscillator → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses os.osc() from Faust standard library - implements phasor with
//   sine lookup table for efficient, alias-free sine generation
//
// USE CASES:
//   - Test tone generation
//   - Sub-bass synthesis
//   - FM synthesis carrier/modulator
//   - Audio signal reference
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 440, 20, 20000, 0.1);
gain = hslider("[1]Amplitude", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

sine_wave = os.osc(freq) * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = sine_wave;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Frequency Range: 20 Hz - 20 kHz (full human hearing range)
// Amplitude Range: 0.0 - 1.0 (prevents clipping)
// Waveform: Pure sinusoidal (fundamental frequency only)
// Phase: Starts at 0° (rising zero crossing)
// Aliasing: None (table lookup is band-limited)
//
// ═══════════════════════════════════════════════════════════════════════════

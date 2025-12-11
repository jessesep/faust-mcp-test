// ═══════════════════════════════════════════════════════════════════════════
// PINK NOISE GENERATOR (1/f noise)
// ═══════════════════════════════════════════════════════════════════════════
//
// Pink noise - equal energy per octave, more natural than white noise
//
// SIGNAL FLOW:
//   Pink Noise Generator → Amplitude Control → Output
//
// DSP CONCEPT:
//   Uses no.pink_noise() from standard library
//   Filters white noise with -3 dB/octave slope
//   Also called "1/f noise" due to inverse frequency relationship
//
// SPECTRAL CONTENT:
//   Equal power per octave (not per Hz like white noise)
//   -3 dB/octave rolloff (10 dB/decade)
//   More perceptually balanced than white noise
//   Sounds "warmer" and "fuller"
//
// USE CASES:
//   - Natural ambient sounds (rain, waterfall)
//   - Audio system testing (more ear-friendly than white)
//   - Room acoustics measurement
//   - Masking noise for concentration
//   - Synth percussion (more natural than white)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

gain = hslider("[0]Amplitude", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

pink_noise = no.pink_noise * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = pink_noise;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Amplitude Range: 0.0 - 1.0
// Frequency Response: -3 dB/octave slope
// Spectral Density: 1/f (inversely proportional to frequency)
// Perceptual Balance: Equal loudness across octaves
//
// COMPARISON TO WHITE NOISE:
//   White noise: 3000 Hz has same energy as 300 Hz
//   Pink noise: 300-600 Hz has same energy as 3000-6000 Hz
//   Result: Pink sounds more balanced, less harsh
//
// OCTAVE ENERGY DISTRIBUTION:
//   Each octave band contains equal energy
//   20-40 Hz: same power as 40-80 Hz
//   80-160 Hz: same power as 160-320 Hz
//   ... equal across entire spectrum
//
// NATURAL OCCURRENCE:
//   Found in nature: ocean waves, rainfall
//   Biological systems: heartbeat intervals, DNA sequences
//   Music: frequency distribution in compositions
//   Economics: stock market fluctuations (!)
//
// AUDIO APPLICATIONS:
//   Audio calibration: More representative of program material
//   Speaker testing: Better balance than white noise
//   Room analysis: Natural-sounding test signal
//   Synthesis: Warmer percussion sounds
//
// SYNTHESIS TIPS:
//   Filter pink noise → natural textures
//   Short pink noise burst + envelope → realistic hi-hat
//   Resonant filter on pink → wind/breath sounds
//   Pink noise + delay → ambient rain texture
//
// ═══════════════════════════════════════════════════════════════════════════

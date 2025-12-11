// ═══════════════════════════════════════════════════════════════════════════
// CHORUS EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic chorus - creates rich, ensemble-like sound from single voice
//
// SIGNAL FLOW:
//   Input → Short Delay (modulated by LFO) → Mix with Original → Output
//
// DSP CONCEPT:
//   Very short delay (10-30ms) modulated by slow LFO
//   Modulation creates pitch variations (Doppler effect)
//   Simulates multiple instruments playing slightly out of tune
//   Creates "shimmering" or "swirling" movement
//
// PARAMETERS:
//   - Rate: Speed of LFO modulation
//   - Depth: Amount of delay time variation
//   - Mix: Balance between dry and chorused signals
//
// USE CASES:
//   - Guitar chorus (80s clean tone)
//   - Synthesizer pad thickening
//   - Vocal doubling/ensemble
//   - Electric piano shimmer
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

rate = hslider("[0]Rate (Hz)", 0.5, 0.1, 5, 0.1);
depth = hslider("[1]Depth", 0.5, 0, 1, 0.01);
mix = hslider("[2]Dry/Wet Mix", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// LFO for modulating delay time
lfo = os.osc(rate);

// Base delay time (center of modulation range)
base_delay_ms = 20;
base_delay_samples = base_delay_ms * ma.SR / 1000;

// Depth scaled in samples (±5ms maximum variation)
max_depth_samples = 5 * ma.SR / 1000;
modulation = lfo * depth * max_depth_samples;

// Variable delay time (base ± modulation)
variable_delay = base_delay_samples + modulation;

// Chorus effect using variable delay
chorus_effect = de.fdelay(4096, variable_delay);

// Mix dry and wet signals
process = _ <: _, chorus_effect : si.interpolate(mix);

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Rate Range: 0.1 Hz - 5 Hz (slow to fast modulation)
// Depth Range: 0.0 - 1.0 (no modulation to maximum)
// Mix Range: 0.0 (dry only) - 1.0 (wet only)
// Base Delay: 20 ms (sweet spot for chorus)
// Max Variation: ±5 ms (at depth = 1.0)
//
// LFO RATE CHARACTERISTICS:
//   0.1-0.5 Hz: Slow, gentle movement (vintage chorus)
//   0.5-1.5 Hz: Medium pace (classic chorus)
//   1.5-3 Hz: Fast, vibrato-like movement
//   3-5 Hz: Very fast, approaching vibrato/tremolo
//
// DEPTH EFFECTS:
//   Low (0.1-0.3): Subtle thickening
//   Medium (0.3-0.6): Clear chorus effect
//   High (0.6-0.9): Strong detuning, obvious
//   Max (1.0): Extreme pitch variation
//
// WHY IT WORKS:
//   Varying delay time = varying pitch (Doppler effect)
//   Short delays = small pitch shifts (cents, not semitones)
//   Multiple slightly-detuned copies = ensemble sound
//   LFO creates continuous, smooth movement
//
// CLASSIC CHORUS SOUNDS:
//   80s clean guitar: Rate 0.7Hz, Depth 0.5, Mix 0.5
//   Vintage synth: Rate 0.3Hz, Depth 0.4, Mix 0.6
//   Bass thickening: Rate 0.5Hz, Depth 0.3, Mix 0.3
//   Dreamy pad: Rate 0.2Hz, Depth 0.7, Mix 0.7
//
// FAMOUS CHORUS PEDALS:
//   Boss CE-1 (Roland): First guitar chorus (1976)
//   Boss CE-2: Classic compact chorus
//   EHX Small Clone: Kurt Cobain's chorus
//   TC Electronic Corona: Modern digital chorus
//
// ENHANCEMENTS (not implemented here):
//   - Multiple LFOs with different rates
//   - Stereo chorus (different LFO phase L/R)
//   - Feedback path for flanger-like character
//   - Highpass filter to prevent bass muddiness
//
// ═══════════════════════════════════════════════════════════════════════════

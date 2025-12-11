// ═══════════════════════════════════════════════════════════════════════════
// LFO (Low Frequency Oscillator)
// ═══════════════════════════════════════════════════════════════════════════
//
// LFO creates cyclic modulation - the "movement" in synthesis
//
// SIGNAL FLOW:
//   LFO (sine wave, <20Hz) → Modulates → Oscillator Frequency → Output
//
// LFO CONCEPT:
//   Low-frequency oscillator (sub-audio range)
//   Creates repeating modulation patterns
//   Adds motion, vibrato, tremolo, animation
//   Unlike audio oscillators: Used for control, not sound
//
// MODULATION TYPES:
//   - Frequency modulation: Vibrato (pitch wobble)
//   - Amplitude modulation: Tremolo (volume wobble)
//   - Filter modulation: Wah-wah effects
//   - Pan modulation: Auto-pan (stereo movement)
//
// USE CASES:
//   - Vibrato on sustained notes
//   - Tremolo effects
//   - Sweeping filter movements
//   - Creating "alive" synthesizer sounds
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

osc_freq = hslider("[0]Oscillator Frequency", 440, 50, 2000, 0.1);

lfo_rate = hslider("[1]LFO Rate (Hz)", 5, 0.1, 20, 0.1);
lfo_depth = hslider("[2]LFO Depth", 0.5, 0, 1, 0.01);
lfo_shape = nentry("[3]LFO Shape [0=Sine, 1=Triangle, 2=Square, 3=Saw]", 0, 0, 3, 1);

mod_target = nentry("[4]Modulation Target [0=Pitch, 1=Amplitude, 2=Filter]", 0, 0, 2, 1);

// ───────────────────────────────────────────────────────────────────────────
// LFO GENERATOR
// ───────────────────────────────────────────────────────────────────────────

// Multiple LFO waveforms
lfo_sine = os.osc(lfo_rate);
lfo_tri = os.triangle(lfo_rate);
lfo_square = os.square(lfo_rate);
lfo_saw = os.sawtooth(lfo_rate);

// Select LFO shape
lfo = ba.selectn(4, lfo_shape, lfo_sine, lfo_tri, lfo_square, lfo_saw) * lfo_depth;

// ───────────────────────────────────────────────────────────────────────────
// MODULATION TARGETS
// ───────────────────────────────────────────────────────────────────────────

// PITCH MODULATION (Vibrato)
// LFO varies pitch ±semitones
vibrato_amount = 2;  // ±2 semitones
pitch_mod = osc_freq * ba.semi2ratio(lfo * vibrato_amount);
vibrato = os.sawtooth(pitch_mod);

// AMPLITUDE MODULATION (Tremolo)
// LFO varies volume
tremolo = os.sawtooth(osc_freq) * (0.5 + (lfo * 0.5));

// FILTER MODULATION (Wah)
// LFO sweeps filter cutoff
base_cutoff = 1000;
cutoff_range = 3000;
filter_cutoff = base_cutoff + (lfo * cutoff_range);
wah = os.sawtooth(osc_freq) : fi.resonlp(filter_cutoff, 10, 1);

// Select modulation target
process = ba.selectn(3, mod_target, vibrato, tremolo, wah) * 0.3;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// LFO FREQUENCY RANGES:
//   0.1-1 Hz: Very slow modulation (ambient, evolving pads)
//   1-5 Hz: Moderate modulation (classic vibrato/tremolo)
//   5-10 Hz: Fast modulation (intense vibrato, wobble bass)
//   10-20 Hz: Very fast (approaching audio rate, ring mod effects)
//   >20 Hz: Audio rate (creates audible sidebands, FM-like)
//
// LFO WAVEFORM CHARACTERISTICS:
//
//   SINE:
//   - Smooth, natural modulation
//   - Best for vibrato and tremolo
//   - Most musical sounding
//   - No abrupt changes
//
//   TRIANGLE:
//   - Linear rise and fall
//   - Similar to sine but with slight edge
//   - Good for filter sweeps
//   - Predictable, steady movement
//
//   SQUARE:
//   - Instant jumps between two states
//   - Creates trill-like effects on pitch
//   - Gated tremolo on amplitude
//   - Wah-wah on filter
//
//   SAWTOOTH:
//   - Linear rise, instant fall
//   - Asymmetric modulation
//   - Interesting for filter sweeps
//   - "Ramp up" character
//
// MODULATION DEPTH:
//   0.0: No modulation (static sound)
//   0.2-0.4: Subtle, adds life
//   0.5-0.7: Noticeable, clear effect
//   0.8-1.0: Extreme, obvious wobble
//
// CLASSIC LFO APPLICATIONS:
//
//   VIBRATO (Pitch Modulation):
//   Rate: 5-7 Hz, Depth: 0.3-0.5, Shape: Sine
//   Amount: ±0.5 to ±2 semitones
//   Vocal-style: Slow rate, shallow depth
//   Guitar-style: Medium rate, medium depth
//
//   TREMOLO (Amplitude Modulation):
//   Rate: 4-6 Hz, Depth: 0.4-0.6, Shape: Sine or Triangle
//   Classic guitar amp tremolo sound
//   Vintage electric piano character
//
//   AUTO-WAH (Filter Modulation):
//   Rate: 0.3-2 Hz, Depth: 0.7-1.0, Shape: Triangle or Sine
//   Sweep range: 500-5000 Hz
//   Resonance: Medium to high (Q=5-15)
//
//   WOBBLE BASS:
//   Rate: 2-8 Hz, Depth: 1.0, Shape: Square or Triangle
//   Filter sweep with high resonance
//   Dubstep characteristic sound
//
// MUSICAL VIBRATO RATES:
//   Classical vocal: 5-6 Hz
//   Jazz/blues guitar: 6-7 Hz
//   Violin: 6-7 Hz
//   Theremin: 6-8 Hz (wider depth)
//
// STEREO LFO TECHNIQUES (not implemented):
//   - Dual LFOs with phase offset (L/R)
//   - Different rates per channel (movement)
//   - Inverted LFO for ping-pong effects
//
// ADVANCED LFO FEATURES (not implemented):
//   - LFO fade-in (delay before modulation starts)
//   - LFO sync to tempo (musical timing)
//   - Sample & hold (random stepped modulation)
//   - Envelope-controlled depth (vibrato on sustain only)
//
// ═══════════════════════════════════════════════════════════════════════════

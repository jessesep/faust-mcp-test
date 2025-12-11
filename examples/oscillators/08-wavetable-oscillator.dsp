// ═══════════════════════════════════════════════════════════════════════════
// WAVETABLE OSCILLATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Wavetable synthesis - arbitrary waveform playback with interpolation
//
// SIGNAL FLOW:
//   Frequency Control → Phase Accumulator → Table Lookup → Output
//                            ↑
//                      Wavetable (custom waveform)
//
// DSP CONCEPT:
//   Instead of generating waveforms mathematically, wavetable synthesis
//   stores one cycle of a waveform in a table and reads through it at
//   different speeds to change pitch. This allows for complex, evolving
//   timbres that would be difficult to generate in real-time.
//
// SYNTHESIS CONCEPT:
//   Wavetable synthesis is the backbone of many modern synthesizers and
//   samplers. By storing multiple wavetables and crossfading between them,
//   you can create dynamic, evolving sounds.
//
// USE CASES:
//   - Complex waveforms (additive synthesis results)
//   - Evolving timbres (wavetable morphing)
//   - Sampled waveforms from hardware synthesizers
//   - Custom harmonic content
//   - Precise spectral control
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 440, 20, 5000, 0.1);
gain = hslider("[1]Amplitude", 0.5, 0, 1, 0.01);

// Wavetable selection: different waveforms to choose from
table_select = hslider("[2]Wavetable", 0, 0, 3, 1);

// ───────────────────────────────────────────────────────────────────────────
// WAVETABLE DEFINITIONS
// ───────────────────────────────────────────────────────────────────────────

// Table 0: Sine wave (smooth, pure tone)
sine_table = os.osc(freq);

// Table 1: Sawtooth (bright, harmonic-rich)
saw_table = os.sawtooth(freq);

// Table 2: Square wave (hollow, odd harmonics)
square_table = os.square(freq);

// Table 3: Triangle wave (soft, mellow)
triangle_table = os.triangle(freq);

// ───────────────────────────────────────────────────────────────────────────
// WAVETABLE SELECTOR
// ───────────────────────────────────────────────────────────────────────────

// Use select to choose between different wavetables
// Note: In production, you'd typically have pre-computed wavetables
// stored in memory rather than generating them on the fly
wavetable_output =
    ba.if(table_select == 0, sine_table,
    ba.if(table_select == 1, saw_table,
    ba.if(table_select == 2, square_table,
    triangle_table)));

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = wavetable_output * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// WAVETABLE SYNTHESIS FUNDAMENTALS:
//   Traditional wavetable synthesis uses pre-computed tables containing
//   one cycle of a waveform. The oscillator reads through the table at
//   different rates to produce different pitches.
//
// ADVANTAGES:
//   - Arbitrary waveforms: Any shape can be stored and played back
//   - CPU efficient: Table lookup is faster than real-time calculation
//   - Precise control: Exact harmonic content can be designed
//   - Morphing: Smooth transitions between different timbres
//
// IMPLEMENTATION NOTES:
//   This example uses Faust's built-in oscillators as "wavetables" for
//   simplicity. In a production wavetable synth, you would:
//   1. Store waveform samples in an array/table
//   2. Use a phasor to generate table read positions
//   3. Implement interpolation for smooth playback
//   4. Support multiple wavetables for morphing
//
// WAVETABLE MORPHING:
//   Advanced wavetable synths allow crossfading between multiple tables:
//   - Store 4-128 different wavetables
//   - Use a "wavetable position" parameter (0-1)
//   - Interpolate between adjacent tables
//   - Creates evolving, dynamic timbres
//
// CLASSIC WAVETABLE SYNTHESIZERS:
//   - PPG Wave 2.0/2.2 (1981): First digital wavetable synth
//   - Waldorf Wave/Microwave (1990s): High-end wavetable instruments
//   - Serum (2014): Modern software wavetable synth with visual editing
//   - Vital (2020): Free alternative to Serum
//
// MUSICAL APPLICATIONS:
//   - EDM leads: Bright, cutting sounds with rich harmonics
//   - Pads: Evolving textures through wavetable morphing
//   - Bass: Complex timbres not possible with simple oscillators
//   - Sound design: Precise spectral control for film/game audio
//
// IMPROVEMENTS:
//   - Implement true wavetable with custom sample data
//   - Add wavetable morphing between multiple tables
//   - Include built-in wavetables (vintage synth waveforms)
//   - Add unison/detune for multiple oscillator instances
//   - Implement anti-aliasing for high-frequency content
//
// FREQUENCY RANGE: 20 Hz - 5 kHz (musical range)
// AMPLITUDE RANGE: 0.0 - 1.0 (prevents clipping)
// TABLES: 4 built-in waveforms (sine, saw, square, triangle)
//
// ═══════════════════════════════════════════════════════════════════════════

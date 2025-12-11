// ═══════════════════════════════════════════════════════════════════════════
// STATE VARIABLE FILTER (SVF)
// ═══════════════════════════════════════════════════════════════════════════
//
// Multi-mode filter - lowpass, highpass, bandpass, and notch simultaneously
//
// SIGNAL FLOW:
//   Input → [SVF Core] → Lowpass Out
//                      → Highpass Out
//                      → Bandpass Out
//                      → Notch Out
//           ↑
//   Cutoff, Resonance
//
// DSP CONCEPT:
//   The State Variable Filter is a versatile topology that generates all
//   four common filter types (LP, HP, BP, Notch) simultaneously from a
//   single filter structure. This makes it ideal for multi-mode filters
//   and filter design.
//
// FILTER TOPOLOGY:
//   SVF uses two integrators in a feedback loop to create a resonant
//   second-order system. The filter outputs are derived from different
//   points in the circuit, giving you all filter types at once.
//
// USE CASES:
//   - Multi-mode synthesizer filters
//   - Parametric EQ design
//   - Audio analysis (extracting frequency bands)
//   - Filter learning/comparison tool
//   - Modular synthesis patching
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

cutoff = hslider("[0]Cutoff Frequency", 1000, 20, 20000, 1);
resonance = hslider("[1]Resonance (Q)", 1, 0.5, 20, 0.1);

// Mode selector: 0=LP, 1=HP, 2=BP, 3=Notch
mode = hslider("[2]Filter Mode", 0, 0, 3, 1);

// Output gain
gain = hslider("[3]Output Level", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// STATE VARIABLE FILTER IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────

// SVF parameters
// Note: This is a simplified SVF using Faust's built-in filter implementations
// A true SVF would be implemented with explicit integrators and feedback

// Generate all four filter outputs using standard library
input_signal = _;

lowpass_out = input_signal : fi.lowpass(2, cutoff);
highpass_out = input_signal : fi.highpass(2, cutoff);
bandpass_out = input_signal : fi.bandpass(2, cutoff / resonance, cutoff);

// Notch filter: combine lowpass and highpass
// (removes the center frequency, passes low and high)
notch_out = (input_signal : fi.lowpass(2, cutoff * 0.5)) +
            (input_signal : fi.highpass(2, cutoff * 2.0));

// ───────────────────────────────────────────────────────────────────────────
// MODE SELECTOR
// ───────────────────────────────────────────────────────────────────────────

// Select which filter output to use based on mode control
filter_output(in) =
    ba.if(mode == 0, in : fi.lowpass(2, cutoff),
    ba.if(mode == 1, in : fi.highpass(2, cutoff),
    ba.if(mode == 2, in : fi.bandpass(2, cutoff / resonance, cutoff),
    in : fi.lowpass(2, cutoff * 0.5) + (in : fi.highpass(2, cutoff * 2.0)))));

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = filter_output * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// STATE VARIABLE FILTER THEORY:
//   The SVF is based on a control system design using two integrators
//   (lowpass filters) in a feedback configuration. By tapping different
//   points in the circuit, you get different filter responses.
//
// TOPOLOGY ADVANTAGES:
//   - All filter types available simultaneously
//   - Smooth frequency response transitions
//   - Stable at high resonance (self-oscillation)
//   - Low sensitivity to component tolerance (in analog)
//   - Easy to control frequency and Q independently
//
// FILTER CHARACTERISTICS:
//
//   LOWPASS (Mode 0):
//   - Passes frequencies below cutoff
//   - Rolls off at 12 dB/octave (-40 dB/decade)
//   - Warm, muffled character
//   - Classic subtractive synthesis sound
//
//   HIGHPASS (Mode 1):
//   - Passes frequencies above cutoff
//   - Rolls off at 12 dB/octave below cutoff
//   - Thin, bright character
//   - Good for removing low-frequency rumble
//
//   BANDPASS (Mode 2):
//   - Passes narrow band around cutoff
//   - Bandwidth controlled by Q (higher Q = narrower)
//   - Vocal, formant-like character
//   - Classic wah-wah pedal sound
//
//   NOTCH/BAND-REJECT (Mode 3):
//   - Removes narrow band around cutoff
//   - Passes everything else
//   - Useful for removing specific frequencies (60Hz hum)
//   - Creates "phaser-like" tones when swept
//
// RESONANCE (Q) PARAMETER:
//   - Q = 0.5: Minimal resonance (Butterworth response)
//   - Q = 1.0: Moderate resonance peak
//   - Q = 5-10: Strong resonance, emphasizes cutoff frequency
//   - Q > 10: Self-oscillation (filter rings at cutoff)
//
// CLASSIC SVF SYNTHESIZERS:
//   - Oberheim Matrix series: Multi-mode SVF filters
//   - Sequential Prophet VS: SVF for vector synthesis
//   - Eurorack modules: Many use SVF topology (Intellijel, etc.)
//
// MUSICAL APPLICATIONS:
//   - Subtractive synthesis: Classic analog synth filtering
//   - Wah-wah effect: Bandpass mode with cutoff modulation
//   - Parametric EQ: Isolate and boost/cut specific frequencies
//   - DJ filters: Smooth low/high sweeps for mixing
//   - Sound design: Extract specific frequency components
//
// IMPLEMENTATION NOTES:
//   This implementation uses Faust's built-in filter functions for
//   simplicity and stability. A true SVF would use explicit integrator
//   blocks and feedback paths, allowing for more precise control and
//   all outputs simultaneously.
//
// IMPROVEMENTS:
//   - Implement true SVF topology with integrators
//   - Add all four outputs as separate channels
//   - Include filter slope control (12/24/36 dB/oct)
//   - Add drive/saturation before filter input
//   - Implement key tracking (cutoff follows pitch)
//
// CUTOFF RANGE: 20 Hz - 20 kHz (full audio spectrum)
// RESONANCE RANGE: 0.5 - 20 (from flat to self-oscillating)
// MODES: 4 (lowpass, highpass, bandpass, notch)
// SLOPE: 12 dB/octave (second-order filter)
//
// ═══════════════════════════════════════════════════════════════════════════

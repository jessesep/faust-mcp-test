// ═══════════════════════════════════════════════════════════════════════════
// LOWPASS FILTER (Resonant)
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic resonant lowpass filter - the heart of subtractive synthesis
//
// SIGNAL FLOW:
//   Sawtooth Oscillator → Lowpass Filter → Output
//   (Cutoff & Resonance Controls)
//
// DSP CONCEPT:
//   Uses fi.resonlp() - resonant lowpass based on 2nd-order filter
//   Cutoff frequency determines which frequencies pass through
//   Resonance (Q) emphasizes frequencies near cutoff
//
// FILTERING ACTION:
//   Passes frequencies BELOW cutoff
//   Attenuates frequencies ABOVE cutoff at ~12 dB/octave
//   Resonance creates peak at cutoff frequency
//   High Q can cause self-oscillation (filter sings)
//
// USE CASES:
//   - Classic analog synth bass sounds
//   - Removing high-frequency content
//   - Creating "sweeping" filter effects
//   - Subtractive synthesis foundation
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

osc_freq = hslider("[0]Oscillator Frequency", 110, 20, 400, 0.1);
cutoff = hslider("[1]Cutoff Frequency", 1000, 20, 20000, 1);
q = hslider("[2]Resonance (Q)", 1, 0.5, 20, 0.1);
gain = hslider("[3]Amplitude", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Sawtooth source (bright, harmonic-rich)
source = os.sawtooth(osc_freq);

// Resonant lowpass filter
filtered = source : fi.resonlp(cutoff, q, 1);

// Output with amplitude control
process = filtered * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Cutoff Range: 20 Hz - 20 kHz (full spectrum sweep)
// Resonance Range: 0.5 - 20 (Q factor)
// Slope: ~12 dB/octave (2-pole filter)
// Filter Type: 2nd-order resonant lowpass
//
// RESONANCE (Q) EXPLAINED:
//   Q = 0.5-1:  Gentle rolloff, minimal emphasis
//   Q = 2-5:    Noticeable peak, classic synth character
//   Q = 5-10:   Strong emphasis, "vocal" quality
//   Q = 10-20:  Extreme resonance, approaches self-oscillation
//   Q > 20:     Can self-oscillate (filter generates tone)
//
// FREQUENCY RESPONSE:
//   Below cutoff: Passes with minimal change
//   At cutoff: Peak emphasis (amount depends on Q)
//   Above cutoff: Attenuated at 12 dB/octave
//
// CLASSIC SYNTHESIS TECHNIQUES:
//   Static filter: Set cutoff for timbral shaping
//   Filter sweep: Modulate cutoff with envelope or LFO
//   Self-oscillation: Very high Q creates pure sine at cutoff
//   Keyboard tracking: Scale cutoff with note frequency
//
// VINTAGE SYNTH EMULATION:
//   Moog ladder filter: Warm, thick, self-oscillates smoothly
//   TB-303 filter: Resonant, "acid" sound character
//   ARP 2600: Multiple modes, aggressive resonance
//
// TIMBRAL CHARACTERISTICS:
//   Low cutoff: Dark, muffled, bass-heavy
//   Mid cutoff: Vowel-like with resonance
//   High cutoff: Bright, approaching unfiltered
//   Swept cutoff: Classic "wah" or "meow" effect
//
// ═══════════════════════════════════════════════════════════════════════════

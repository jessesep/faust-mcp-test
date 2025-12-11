// ═══════════════════════════════════════════════════════════════════════════
// HIGHPASS FILTER (Resonant)
// ═══════════════════════════════════════════════════════════════════════════
//
// Resonant highpass filter - removes low frequencies, emphasizes highs
//
// SIGNAL FLOW:
//   Sawtooth Oscillator → Highpass Filter → Output
//   (Cutoff & Resonance Controls)
//
// DSP CONCEPT:
//   Uses fi.resonhp() - resonant highpass based on 2nd-order filter
//   Cutoff frequency determines which frequencies are removed
//   Resonance (Q) emphasizes frequencies near cutoff
//
// FILTERING ACTION:
//   Passes frequencies ABOVE cutoff
//   Attenuates frequencies BELOW cutoff at ~12 dB/octave
//   Resonance creates peak at cutoff frequency
//   Opposite behavior of lowpass filter
//
// USE CASES:
//   - Removing rumble and low-frequency noise
//   - Creating thin, bright timbres
//   - Percussion clarity (removing mud)
//   - "Telephone" or "radio" effects
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

osc_freq = hslider("[0]Oscillator Frequency", 110, 20, 400, 0.1);
cutoff = hslider("[1]Cutoff Frequency", 500, 20, 20000, 1);
q = hslider("[2]Resonance (Q)", 1, 0.5, 20, 0.1);
gain = hslider("[3]Amplitude", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Sawtooth source
source = os.sawtooth(osc_freq);

// Resonant highpass filter
filtered = source : fi.resonhp(cutoff, q, 1);

// Output with amplitude control
process = filtered * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Cutoff Range: 20 Hz - 20 kHz
// Resonance Range: 0.5 - 20 (Q factor)
// Slope: ~12 dB/octave (2-pole filter)
// Filter Type: 2nd-order resonant highpass
//
// FREQUENCY RESPONSE:
//   Below cutoff: Attenuated at 12 dB/octave
//   At cutoff: Peak emphasis (amount depends on Q)
//   Above cutoff: Passes with minimal change
//
// RESONANCE EFFECTS:
//   Low Q: Gentle slope, natural-sounding
//   Medium Q: Emphasis at cutoff, "presence" boost
//   High Q: Strong peak, can ring at cutoff frequency
//   Very high Q: Self-oscillation possible
//
// PRACTICAL APPLICATIONS:
//   Low cutoff (20-100 Hz): Remove rumble/DC offset
//   Mid cutoff (200-800 Hz): Thin out muddy signals
//   High cutoff (2-10 kHz): Isolate brightness/air
//   Sweep with resonance: "Reverse filter sweep" effect
//
// TIMBRAL CHARACTERISTICS:
//   Low cutoff: Full-bodied, removes only rumble
//   Mid cutoff: Thin, "telephone" quality
//   High cutoff: Extremely thin, hissy, ethereal
//   With resonance: Emphasizes cutoff frequency
//
// COMPLEMENTARY TO LOWPASS:
//   Lowpass: Keeps lows, removes highs
//   Highpass: Keeps highs, removes lows
//   Together: Can create bandpass or notch effects
//
// MIXING APPLICATIONS:
//   Bass cleanup: HPF at 30-40 Hz removes subsonic content
//   Vocal clarity: HPF at 80-100 Hz removes proximity effect
//   Percussion: HPF emphasizes attack transients
//   Special FX: Swept HPF creates "emerging" effect
//
// ═══════════════════════════════════════════════════════════════════════════

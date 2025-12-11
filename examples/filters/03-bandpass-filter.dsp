// ═══════════════════════════════════════════════════════════════════════════
// BANDPASS FILTER (Resonant)
// ═══════════════════════════════════════════════════════════════════════════
//
// Resonant bandpass filter - passes frequencies in a specific range
//
// SIGNAL FLOW:
//   Sawtooth Oscillator → Bandpass Filter → Output
//   (Center Frequency & Bandwidth Controls)
//
// DSP CONCEPT:
//   Uses fi.resonbp() - resonant bandpass filter
//   Center frequency determines the passband location
//   Q (resonance) controls bandwidth - higher Q = narrower band
//
// FILTERING ACTION:
//   Passes frequencies NEAR center frequency
//   Attenuates frequencies above AND below
//   Creates peak at center frequency
//   Useful for isolating specific frequency ranges
//
// USE CASES:
//   - Vocal formant simulation
//   - "Wah-wah" effects
//   - Telephone/radio bandlimited effects
//   - Isolating harmonics from complex signals
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

osc_freq = hslider("[0]Oscillator Frequency", 110, 20, 400, 0.1);
center = hslider("[1]Center Frequency", 1000, 100, 10000, 1);
q = hslider("[2]Resonance (Q)", 10, 0.5, 50, 0.1);
gain = hslider("[3]Amplitude", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Sawtooth source (bright, full of harmonics to filter)
source = os.sawtooth(osc_freq);

// Resonant bandpass filter
filtered = source : fi.resonbp(center, q, 1);

// Output with amplitude control (boosted due to filtering loss)
process = filtered * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Center Frequency: 100 Hz - 10 kHz
// Resonance Range: 0.5 - 50 (Q factor)
// Bandwidth: Varies inversely with Q
// Filter Type: 2nd-order resonant bandpass
//
// RELATIONSHIP BETWEEN Q AND BANDWIDTH:
//   Bandwidth = Center_Freq / Q
//   Q = 1:   Wide passband (Center ± 50%)
//   Q = 10:  Narrow passband (Center ± 5%)
//   Q = 50:  Very narrow (Center ± 1%)
//   Higher Q = Narrower bandwidth = More selective
//
// FREQUENCY RESPONSE:
//   Below center: Attenuated (lowpass behavior)
//   At center: Peak (magnitude depends on Q)
//   Above center: Attenuated (highpass behavior)
//   Result: "Bell curve" around center frequency
//
// BANDWIDTH EXAMPLES (1000 Hz center):
//   Q = 1:  Bandwidth ≈ 1000 Hz (500-1500 Hz approx)
//   Q = 5:  Bandwidth ≈ 200 Hz (900-1100 Hz approx)
//   Q = 10: Bandwidth ≈ 100 Hz (950-1050 Hz approx)
//   Q = 50: Bandwidth ≈ 20 Hz (990-1010 Hz approx)
//
// MUSICAL APPLICATIONS:
//   Formant synthesis: Multiple BP filters = vowel sounds
//   Wah-wah effect: Swept bandpass with medium Q
//   Vocal simulation: BP at 800 Hz, 1200 Hz, 2400 Hz (formants)
//   Harmonic isolation: Very high Q isolates single harmonic
//
// VOWEL FORMANT FREQUENCIES:
//   "AH" (father): 730 Hz, 1090 Hz, 2440 Hz
//   "EE" (beet):   270 Hz, 2290 Hz, 3010 Hz
//   "OO" (boot):   300 Hz,  870 Hz, 2240 Hz
//   Use 3 parallel BP filters at these frequencies
//
// CLASSIC EFFECTS:
//   Wah pedal: Foot-controlled bandpass sweep (Q ≈ 10-20)
//   Auto-wah: LFO-modulated center frequency
//   Talk box: Multiple bandpass filters (formant shaping)
//   Ring modulator + BP: Metallic, robotic effects
//
// TIMBRAL CHARACTERISTICS:
//   Low Q: Warm, full-bodied, gentle filtering
//   Medium Q: Vocal-like, resonant character
//   High Q: Thin, nasal, "telephone" quality
//   Very high Q: Pure-tone isolation, ringing
//
// ═══════════════════════════════════════════════════════════════════════════

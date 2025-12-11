// ═══════════════════════════════════════════════════════════════════════════
// NOTCH FILTER (Band-Reject)
// ═══════════════════════════════════════════════════════════════════════════
//
// Notch filter - removes frequencies in a narrow band, passes everything else
//
// SIGNAL FLOW:
//   White Noise → Notch Filter → Output
//   (Notch Frequency & Q Controls)
//
// DSP CONCEPT:
//   Complement of bandpass filter
//   Removes frequencies near notch frequency
//   Passes frequencies above and below
//   Also called "band-reject" or "band-stop" filter
//
// FILTERING ACTION:
//   Passes frequencies BELOW notch frequency
//   Passes frequencies ABOVE notch frequency
//   Attenuates frequencies AT notch frequency
//   Creates "dip" in frequency spectrum
//
// USE CASES:
//   - Removing 60 Hz hum (mains frequency)
//   - Eliminating feedback frequencies
//   - Creating "phaser" effects (multiple notches)
//   - Surgical removal of problem frequencies
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

notch_freq = hslider("[0]Notch Frequency", 1000, 20, 20000, 1);
q = hslider("[1]Q Factor", 10, 0.5, 100, 0.1);
gain = hslider("[2]Amplitude", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// White noise source (to hear the notch effect clearly)
source = no.noise;

// Notch filter implementation: sum of HP and LP
// (Alternative: difference between signal and BP at same freq)
notched = source : (fi.resonhp(notch_freq, q, 1) + fi.resonlp(notch_freq, q, 1)) / 2;

// Output with amplitude control
process = notched * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Notch Frequency: 20 Hz - 20 kHz (center of rejection band)
// Q Range: 0.5 - 100 (controls notch width)
// Attenuation: Theoretically infinite at exact notch frequency
// Filter Type: 2nd-order notch (combination of HP + LP)
//
// Q FACTOR EFFECTS:
//   Low Q (0.5-5):  Wide notch, gradual attenuation
//   Medium Q (5-20): Moderate notch, selective removal
//   High Q (20-100): Very narrow notch, surgical precision
//   Higher Q = Narrower rejection band
//
// NOTCH WIDTH EXAMPLES (1000 Hz center):
//   Q = 1:   Wide notch (±500 Hz affected)
//   Q = 10:  Narrow notch (±50 Hz affected)
//   Q = 50:  Very narrow (±10 Hz affected)
//   Q = 100: Surgical (±5 Hz affected)
//
// FREQUENCY RESPONSE:
//   Below notch: Passes unchanged
//   At notch: Maximum attenuation (deep null)
//   Above notch: Passes unchanged
//   Result: "Inverted peak" or "dip" in spectrum
//
// PRACTICAL APPLICATIONS:
//
//   PROBLEM FREQUENCY REMOVAL:
//   60 Hz hum: Notch at 60 Hz (Q ≈ 10-20)
//   50 Hz hum: Notch at 50 Hz (European mains)
//   Feedback: Narrow notch at feedback frequency
//   Resonance: Remove unwanted room modes
//
//   CREATIVE EFFECTS:
//   Phaser: Multiple notches swept together
//   Comb filtering: Series of evenly-spaced notches
//   Spectral carving: Remove specific harmonics
//   "Hollow" effect: Notch at fundamental
//
// IMPLEMENTATION NOTE:
//   This example uses HP + LP combination
//   Alternative: Original_Signal - Bandpass_Signal
//   Both methods create notch filter response
//
// MUSICAL APPLICATIONS:
//   Remove fundamental from harmonic-rich source
//   Create "missing fundamental" illusion
//   Sweeping notch for phaser-like effects
//   Fixed notch for timbral character
//
// COMPARISON TO OTHER FILTERS:
//   Lowpass: Keeps lows only
//   Highpass: Keeps highs only
//   Bandpass: Keeps middle only
//   Notch: Keeps lows AND highs, removes middle
//
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// FM SYNTHESIZER (Frequency Modulation)
// ═══════════════════════════════════════════════════════════════════════════
//
// 2-operator FM synthesis - creates complex timbres from simple sine waves
//
// SIGNAL FLOW:
//   Modulator Oscillator (sine) → Scales by Index → Modulates →
//   Carrier Oscillator (sine) → Amplitude Envelope → Output
//
// FM CONCEPT:
//   Modulator frequency modulates carrier frequency
//   Creates sidebands (new frequencies) mathematically
//   Simple algorithm, complex results
//   Unlike subtractive synthesis (filter-based)
//
// PARAMETERS:
//   - Carrier Freq: Main perceived pitch
//   - Modulator Ratio: Harmonic/inharmonic relationship
//   - Modulation Index: Amount of frequency deviation
//
// USE CASES:
//   - Bell and metallic sounds
//   - Electric piano (DX7 style)
//   - Brass instruments
//   - Percussive tones
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

carrier_freq = hslider("[0]Carrier Frequency", 440, 50, 2000, 0.1);
mod_ratio = hslider("[1]Modulator Ratio", 1.0, 0.25, 16, 0.01);
mod_index = hslider("[2]Modulation Index", 5, 0, 20, 0.1);

// Envelope parameters
attack = hslider("[3]Attack", 0.01, 0.001, 2, 0.001);
decay = hslider("[4]Decay", 0.3, 0.001, 2, 0.001);
sustain = hslider("[5]Sustain", 0.5, 0, 1, 0.01);
release = hslider("[6]Release", 0.5, 0.001, 3, 0.001);

// Gate for envelope triggering
gate = button("[7]Note On/Off");

// Output level
output_gain = hslider("[8]Output Level", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// FM SYNTHESIS ENGINE
// ───────────────────────────────────────────────────────────────────────────

// Calculate modulator frequency
modulator_freq = carrier_freq * mod_ratio;

// Modulator oscillator (sine wave)
modulator = os.osc(modulator_freq);

// Frequency deviation amount
deviation = modulator_freq * mod_index;

// Carrier frequency modulated by modulator
// carrier_freq + (modulator * deviation)
fm_carrier = os.osc(carrier_freq + (modulator * deviation));

// ADSR envelope
envelope = en.adsr(attack, decay, sustain, release, gate);

// Apply envelope and output gain
process = fm_carrier * envelope * output_gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// FM SYNTHESIS METHOD: Frequency Modulation (Yamaha, 1970s)
//
// OPERATOR CONFIGURATION:
//   2-operator algorithm: Modulator → Carrier
//   Both operators are sine waves
//   Simplest FM configuration, still very powerful
//
// MODULATION INDEX (β):
//   Controls frequency deviation amount
//   Index 0: No modulation (pure carrier sine)
//   Index 1-5: Musical, harmonic-rich timbres
//   Index 5-10: Complex, bright sounds
//   Index 10+: Noise-like, extremely complex
//
// CARRIER-TO-MODULATOR RATIO:
//   Integer ratios (1:1, 2:1, 3:1): Harmonic spectra
//   Non-integer ratios (1.5:1, π:1): Inharmonic (bell-like)
//
//   HARMONIC RATIOS (musical):
//   1:1 = Octave relationship (warm, thick)
//   2:1 = Fifth relationship
//   3:1 = Major third relationship
//
//   INHARMONIC RATIOS (metallic):
//   1.414:1 (√2) = Slightly detuned (shimmer)
//   1.618:1 (φ golden ratio) = Bell-like
//   π:1 = Unusual, complex timbre
//
// SIDEBANDS EXPLAINED:
//   FM creates frequencies at: Carrier ± (n * Modulator)
//   where n = 1, 2, 3, 4... (integer multiples)
//   Number of audible sidebands increases with index
//
//   Example: C=440Hz, M=440Hz (1:1 ratio), Index=2:
//   Sidebands at: 440±440, 440±880, 440±1320...
//   = 0Hz, 880Hz, 1320Hz, ... (harmonic series!)
//
// AMPLITUDE OF SIDEBANDS:
//   Determined by Bessel functions (complex math)
//   Generally: Higher sidebands = lower amplitude
//   Index controls sideband distribution
//   Creates rich, evolving spectra
//
// DYNAMIC TIMBRES:
//   Envelope on amplitude: Standard note shaping
//   Envelope on mod index: Dynamic brightness
//   (Not implemented here, but possible enhancement)
//
// CLASSIC FM SOUNDS:
//
//   ELECTRIC PIANO (DX7 STYLE):
//   Carrier: 220Hz, Ratio: 1.0, Index: 2-4
//   Envelope: A=0.01, D=0.5, S=0.3, R=0.8
//
//   BELL / METALLIC:
//   Carrier: 440Hz, Ratio: 1.414, Index: 8
//   Envelope: A=0.001, D=1.5, S=0.1, R=2.0
//
//   BRASS:
//   Carrier: 330Hz, Ratio: 1.0, Index: 5
//   Envelope: A=0.1, D=0.3, S=0.7, R=0.3
//
//   BASS:
//   Carrier: 110Hz, Ratio: 2.0, Index: 3
//   Envelope: A=0.01, D=0.2, S=0.6, R=0.3
//
//   GONG:
//   Carrier: 200Hz, Ratio: 3.14 (π), Index: 12
//   Envelope: A=0.01, D=2.0, S=0.2, R=3.0
//
// FAMOUS FM SYNTHESIZERS:
//   Yamaha DX7 (1983): Defined 80s pop sound
//   Yamaha DX21, DX27, TX81Z: Affordable FM
//   Native Instruments FM8: Modern software FM
//
// ADVANTAGES OF FM:
//   Complex sounds from simple building blocks
//   Efficient (minimal oscillators needed)
//   Bright, cutting timbres
//   Evolving, dynamic spectra
//
// COMPARED TO SUBTRACTIVE:
//   Subtractive: Start complex, remove frequencies
//   FM: Start simple, add frequencies
//   FM better for: Bells, metallic, bright tones
//   Subtractive better for: Warm, organic, traditional
//
// ENHANCEMENTS (not implemented):
//   - Modulation index envelope (dynamic brightness)
//   - Additional operators (4-op, 6-op algorithms)
//   - Feedback on carrier or modulator
//   - Multiple mod → carrier routing (DX7 style)
//
// ═══════════════════════════════════════════════════════════════════════════

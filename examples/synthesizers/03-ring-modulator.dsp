// ═══════════════════════════════════════════════════════════════════════════
// RING MODULATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Frequency modulation synthesis - creates metallic, bell-like timbres
//
// SIGNAL FLOW:
//   Carrier Oscillator → [×] → Output
//                        ↑
//              Modulator Oscillator
//
// DSP CONCEPT:
//   Ring modulation multiplies two signals together, creating sum and
//   difference frequencies. If carrier = C and modulator = M:
//   Output contains: (C + M) and (C - M)
//   The original frequencies C and M disappear!
//
// SYNTHESIS CONCEPT:
//   Ring modulation creates complex, inharmonic spectra from simple sine
//   waves. When the carrier and modulator frequencies are in simple ratios
//   (1:1, 1:2, 2:3), you get musical, bell-like sounds. When they're not,
//   you get metallic, robotic, or alien tones.
//
// USE CASES:
//   - Metallic/robotic effects (Daleks, sci-fi)
//   - Bell and chime synthesis
//   - Inharmonic timbres for experimental music
//   - Vocal processing (robotic voices)
//   - Sound design for film/games
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - CARRIER OSCILLATOR
// ───────────────────────────────────────────────────────────────────────────

carrier_freq = hslider("[0]Carrier Frequency", 440, 20, 5000, 1);
carrier_waveform = hslider("[1]Carrier Wave", 0, 0, 2, 1); // 0=sine, 1=saw, 2=square

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - MODULATOR OSCILLATOR
// ───────────────────────────────────────────────────────────────────────────

// Modulator can be set as ratio or absolute frequency
mod_ratio = hslider("[2]Modulator Ratio", 1.0, 0.125, 8, 0.125);
mod_waveform = hslider("[3]Modulator Wave", 0, 0, 2, 1); // 0=sine, 1=saw, 2=square

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - OUTPUT
// ───────────────────────────────────────────────────────────────────────────

// Mix between carrier and ring-modulated output
dry_wet = hslider("[4]Dry/Wet Mix", 1.0, 0, 1, 0.01);
output_gain = hslider("[5]Output Level", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// OSCILLATOR GENERATION
// ───────────────────────────────────────────────────────────────────────────

// Carrier oscillator with waveform selection
carrier_sine = os.osc(carrier_freq);
carrier_saw = os.sawtooth(carrier_freq);
carrier_square = os.square(carrier_freq);

carrier =
    ba.if(carrier_waveform == 0, carrier_sine,
    ba.if(carrier_waveform == 1, carrier_saw,
    carrier_square));

// Modulator frequency based on carrier ratio
modulator_freq = carrier_freq * mod_ratio;

// Modulator oscillator with waveform selection
mod_sine = os.osc(modulator_freq);
mod_saw = os.sawtooth(modulator_freq);
mod_square = os.square(modulator_freq);

modulator =
    ba.if(mod_waveform == 0, mod_sine,
    ba.if(mod_waveform == 1, mod_saw,
    mod_square));

// ───────────────────────────────────────────────────────────────────────────
// RING MODULATION
// ───────────────────────────────────────────────────────────────────────────

// Classic ring modulation: multiply carrier × modulator
ring_mod_output = carrier * modulator;

// ───────────────────────────────────────────────────────────────────────────
// DRY/WET MIX
// ───────────────────────────────────────────────────────────────────────────

// Mix between dry carrier and wet (ring-modulated) signal
output_signal = (carrier * (1 - dry_wet)) + (ring_mod_output * dry_wet);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = output_signal * output_gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// RING MODULATION THEORY:
//   When you multiply two sine waves at frequencies C (carrier) and M
//   (modulator), the output contains two new frequencies:
//   - Sum: C + M
//   - Difference: C - M
//
//   The original frequencies C and M are removed (suppressed carrier).
//   This is why ring modulation sounds so different from the input tones.
//
// FREQUENCY RELATIONSHIPS:
//
//   HARMONIC RATIOS (Musical):
//   - 1:1 (C=M): Octave doubling effect
//   - 1:2: Produces C+2C and 2C-C = C and 3C (harmonic)
//   - 2:3: Creates musical intervals
//   - 3:5: Bell-like timbres
//
//   INHARMONIC RATIOS (Metallic):
//   - 1:1.41: Slightly detuned, metallic
//   - 1:π: Completely inharmonic, robotic
//   - Random: Chaotic, noise-like
//
// WAVEFORM COMBINATIONS:
//
//   SINE × SINE:
//   - Purest ring modulation
//   - Two frequencies only: C+M and C-M
//   - Bell-like when harmonically related
//   - Clean, simple spectrum
//
//   SINE × SAW/SQUARE:
//   - Multiple sidebands (saw/square has harmonics)
//   - Richer, more complex timbre
//   - Still retains some carrier character
//
//   SAW × SAW or SQUARE × SQUARE:
//   - Dense, complex spectrum
//   - Metallic, noisy character
//   - Many intermodulation products
//
// CLASSIC PRESETS:
//
//   BELL (Harmonic):
//   Carrier: 440 Hz (Sine)
//   Modulator: 2:3 ratio (Sine)
//   Dry/Wet: 100%
//   → Creates bell-like, musical tone
//
//   DALEK VOICE (Robotic):
//   Carrier: 30-60 Hz (Square)
//   Modulator: 1:1 ratio (Square)
//   Dry/Wet: 80%
//   → Classic sci-fi robot voice
//
//   METALLIC PAD:
//   Carrier: 220 Hz (Saw)
//   Modulator: 1:1.5 ratio (Sine)
//   Dry/Wet: 60%
//   → Shimmering, metallic texture
//
//   GONG/CHIME:
//   Carrier: 880 Hz (Sine)
//   Modulator: 1:4.7 ratio (Sine)
//   Dry/Wet: 100%
//   → Metallic percussion sound
//
// FAMOUS USES:
//   - Doctor Who: Dalek voices (1960s)
//   - Kraftwerk: Robotic vocal effects
//   - Joe Meek: Early experimental pop production
//   - Stockhausen: Electronic music compositions
//   - Boards of Canada: Retro synth textures
//
// RING MOD IN SYNTHESIZERS:
//   - Moog Modular: Classic ring mod module
//   - ARP 2600: Built-in ring modulator
//   - EMS VCS3: Matrix-routable ring mod
//   - Eurorack: Many dedicated ring mod modules
//
// MUSICAL APPLICATIONS:
//   - Sound effects: Sci-fi, robots, aliens
//   - Bells and chimes: Tuned percussion synthesis
//   - Vocal processing: Extreme transformation
//   - Experimental music: Inharmonic textures
//   - Bass sounds: Sub-octave generation (via sum/difference)
//
// RING MOD VS. AMPLITUDE MODULATION:
//   - Ring Mod: Suppresses carrier (no C or M in output)
//   - AM: Retains carrier (output has C, C+M, C-M)
//   - AM is what tremolo becomes at audio rates
//
// IMPLEMENTATION NOTES:
//   This implementation provides:
//   1. Carrier and modulator waveform selection
//   2. Ratio-based modulator frequency control
//   3. Dry/wet mix for blending with original signal
//   4. Simple multiplication for pure ring modulation
//
// IMPROVEMENTS:
//   - Add envelope control for carrier and modulator
//   - Include LFO modulation of carrier/modulator ratio
//   - Add filter before or after ring modulation
//   - Implement cross-modulation (FM + ring mod)
//   - Add external audio input as modulator
//
// CARRIER RANGE: 20-5000 Hz (musical range)
// MODULATOR RATIO: 0.125-8 (wide range of relationships)
// WAVEFORMS: Sine, Sawtooth, Square (for both osc)
// OUTPUT: Mixed dry/wet signal with level control
//
// ═══════════════════════════════════════════════════════════════════════════

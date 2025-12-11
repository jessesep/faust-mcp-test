// ═══════════════════════════════════════════════════════════════════════════
// PULSE WAVE OSCILLATOR (Variable Duty Cycle)
// ═══════════════════════════════════════════════════════════════════════════
//
// Variable-width pulse wave - from thin pulse to wide pulse
//
// SIGNAL FLOW:
//   Frequency + Duty Cycle Controls → Pulse Generator → Amplitude → Output
//
// DSP CONCEPT:
//   Uses os.pulsetrain() for band-limited pulse wave generation
//   Duty cycle controls the ratio of high-to-low periods
//   50% duty = square wave, <50% = thin pulse, >50% = wide pulse
//
// HARMONIC CONTENT:
//   Duty cycle dramatically affects timbre:
//   - 50%: Only odd harmonics (square wave)
//   - Other values: Both odd and even harmonics appear
//   - Minimum harmonics at 50%, maximum at 0% or 100%
//
// USE CASES:
//   - Classic analog synth timbres (Moog, ARP style)
//   - Pulse width modulation (PWM) synthesis
//   - Reed and brass-like tones
//   - Vintage string machine sounds
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 110, 20, 20000, 0.1);
duty = hslider("[1]Pulse Width", 0.5, 0.01, 0.99, 0.01);  // 0.5 = square
gain = hslider("[2]Amplitude", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

pulse_wave = os.pulsetrain(freq, duty) * gain;

// ───────────────────────────────────────────────────────────────────────────
// OUTPUT
// ───────────────────────────────────────────────────────────────────────────

process = pulse_wave;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Frequency Range: 20 Hz - 20 kHz
// Duty Cycle Range: 1% - 99% (avoid 0% and 100% extremes)
// Amplitude Range: 0.0 - 1.0
// Anti-Aliasing: Band-limited pulsetrain algorithm
//
// DUTY CYCLE EFFECTS ON TIMBRE:
//   10% duty: Very thin, nasal, clarinet-like
//   25% duty: Thin pulse, hollow sound
//   50% duty: Square wave (odd harmonics only)
//   75% duty: Wide pulse, thick sound
//   90% duty: Very wide, approaching sawtooth character
//
// PULSE WIDTH MODULATION (PWM):
//   Modulating duty cycle creates classic analog synth chorus effect
//   Example: duty = 0.5 + 0.4 * os.osc(5);
//   Creates rich, animated stereo field when combined
//
// HARMONIC BEHAVIOR:
//   Even harmonics appear except at 50% duty cycle
//   Harmonic nulls occur at integer multiples of 1/duty_cycle
//   Example at 25% duty: nulls at 4th, 8th, 12th harmonics
//
// VINTAGE SYNTHESIS:
//   Moog synthesizers: Classic PWM lead sounds
//   Roland Juno: Chorus ensemble from dual pulse PWM
//   ARP Odyssey: Sync'd pulse waves for aggressive leads
//
// ═══════════════════════════════════════════════════════════════════════════

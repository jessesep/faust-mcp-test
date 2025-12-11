// ═══════════════════════════════════════════════════════════════════════════
// TREMOLO EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Amplitude modulation effect - rhythmic volume variation
//
// SIGNAL FLOW:
//   Input → [×] → Output
//           ↑
//        LFO (volume modulation)
//
// DSP CONCEPT:
//   Tremolo creates rhythmic volume variations by multiplying the input
//   signal with a low-frequency oscillator (LFO). The LFO modulates the
//   amplitude, creating a pulsing or warbling effect. This is one of the
//   oldest guitar effects.
//
// EFFECT CONCEPT:
//   Originally implemented in guitar amplifiers using tube circuits that
//   varied the bias voltage, tremolo creates a rhythmic "wobble" in volume.
//   Not to be confused with vibrato (pitch modulation).
//
// USE CASES:
//   - Guitar amplifier effect (classic surf rock)
//   - Synthesizer pads (adding movement)
//   - Rhythmic effects in electronic music
//   - Vintage tone coloration
//   - Autopan simulation (stereo tremolo)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

// LFO parameters
rate = hslider("[0]Rate (Hz)", 5, 0.1, 20, 0.1);
depth = hslider("[1]Depth", 0.5, 0, 1, 0.01);

// Waveform selector: 0=sine, 1=triangle, 2=square
waveform = hslider("[2]Waveform", 0, 0, 2, 1);

// Output level
output_gain = hslider("[3]Output Level", 0.8, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// LFO GENERATION
// ───────────────────────────────────────────────────────────────────────────

// Sine wave LFO - smooth, musical tremolo
sine_lfo = os.osc(rate);

// Triangle wave LFO - linear ramp, different character
triangle_lfo = os.triangle(rate);

// Square wave LFO - hard on/off gating effect
square_lfo = os.square(rate);

// Select waveform based on control
lfo_output =
    ba.if(waveform == 0, sine_lfo,
    ba.if(waveform == 1, triangle_lfo,
    square_lfo));

// ───────────────────────────────────────────────────────────────────────────
// TREMOLO EFFECT
// ───────────────────────────────────────────────────────────────────────────

// Convert LFO from [-1, +1] to modulation amount
// Depth controls how much the volume varies
// 0% depth = no effect (constant volume)
// 100% depth = full volume swing (silence to full)

// Scale LFO to [1-depth, 1]
// This ensures volume never goes below (1-depth)
modulation_signal = 1 - (depth * 0.5) + (lfo_output * depth * 0.5);

// Apply tremolo by multiplying input with modulation
tremolo_effect(input) = input * modulation_signal;

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = _ : tremolo_effect : *(output_gain);

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// TREMOLO FUNDAMENTALS:
//   Tremolo is amplitude modulation (AM) at sub-audio rates. The carrier
//   (your audio signal) is multiplied by a modulator (LFO), creating
//   rhythmic volume changes. Unlike vibrato (frequency modulation),
//   tremolo doesn't change the pitch.
//
// KEY PARAMETERS:
//
//   RATE (0.1-20 Hz):
//   - Slow (0.1-2 Hz): Gentle swell, breathing effect
//   - Medium (2-8 Hz): Classic tremolo, rhythmic pulse
//   - Fast (8-20 Hz): Ring modulation territory, pitched artifacts
//
//   DEPTH (0-1):
//   - Shallow (0-0.3): Subtle movement, always audible
//   - Medium (0.3-0.7): Pronounced tremolo, classic sound
//   - Deep (0.7-1.0): Extreme volume variation, near silence
//
//   WAVEFORM:
//   - Sine: Smooth, musical, vintage amp character
//   - Triangle: Linear ramps, more modern/mechanical
//   - Square: Gating effect, hard on/off (rhythmic chopping)
//
// TREMOLO VS VIBRATO:
//   Many people confuse these terms:
//   - TREMOLO: Volume/amplitude modulation (what this effect does)
//   - VIBRATO: Pitch/frequency modulation (like a vibrato arm)
//
//   Confusingly, Fender calls their vibrato "Tremolo" on the Stratocaster!
//
// MUSICAL CONTEXT:
//   Tremolo was one of the first built-in guitar amp effects:
//   - Fender amps (1950s): Tube-based tremolo circuits
//   - Vox AC30 (1960s): Famous "Top Boost" tremolo
//   - Used extensively in surf rock, blues, and indie music
//
// CLASSIC TREMOLO UNITS:
//   - Fender Tremolux/Vibrolux amps: Vintage tube tremolo
//   - Vox AC30 with "Vibrato" channel (actually tremolo)
//   - Boss TR-2 Tremolo: Modern pedal standard
//   - Strymon Flint: High-end digital recreation
//
// FAMOUS TREMOLO SONGS:
//   - "Gimme Shelter" - Rolling Stones
//   - "Boulevard of Broken Dreams" - Green Day
//   - "How Soon Is Now?" - The Smiths (extreme tremolo)
//   - "Crimson and Clover" - Tommy James
//
// STEREO TREMOLO (AUTOPAN):
//   By using two LFOs 180° out of phase (one for left, one for right),
//   you can create an autopan effect where the sound moves left-to-right:
//   - Left channel: LFO at 0°
//   - Right channel: LFO at 180° (inverted)
//   - Creates spatial movement
//
// MUSICAL APPLICATIONS:
//   - Guitar: Classic surf rock, indie rock texture
//   - Keyboards: Vintage electric piano sound (Wurlitzer)
//   - Pads: Add movement to static synth sounds
//   - Drums: Rhythmic gating effect on percussion
//   - Orchestral: Simulate tremolo strings technique
//
// HARMONIC TREMOLO:
//   Advanced variation that splits signal into high/low bands and
//   modulates them in opposite phase, creating a more complex effect
//   (like Fender brownface amps).
//
// IMPLEMENTATION NOTES:
//   The LFO is scaled so that:
//   - At depth = 0: modulation_signal = 1 (no effect)
//   - At depth = 1: modulation_signal varies from 0 to 1 (full effect)
//
//   This prevents the signal from going into negative gain (phase flip).
//
// IMPROVEMENTS:
//   - Add stereo autopan mode (phase-offset LFOs)
//   - Implement harmonic tremolo (frequency-split modulation)
//   - Add envelope follower for dynamic rate control
//   - Include tap tempo for rhythmic synchronization
//   - Add soft-clip saturation for vintage character
//
// RATE RANGE: 0.1-20 Hz (slow swell to fast warble)
// DEPTH RANGE: 0-100% (subtle to extreme)
// WAVEFORMS: 3 (sine, triangle, square)
// OUTPUT: Unity gain when depth = 0
//
// ═══════════════════════════════════════════════════════════════════════════

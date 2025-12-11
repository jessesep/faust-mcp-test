// ═══════════════════════════════════════════════════════════════════════════
// FLANGER EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic jet-plane/whooshing modulation effect using short delay
//
// SIGNAL FLOW:
//   Input → [+] → Output
//           ↑
//           |
//           Short Delay (0-10ms)
//                ↑
//           LFO Modulation
//           Feedback
//
// DSP CONCEPT:
//   Flanging creates a comb filter effect by mixing a signal with a very
//   short delayed copy of itself. When the delay time is modulated by an
//   LFO, it creates the characteristic "jet plane" or "whooshing" sound
//   with moving notches in the frequency spectrum.
//
// EFFECT CONCEPT:
//   Originally created by manually varying tape playback speed (flanging
//   the tape reel), digital flangers recreate this with modulated delays.
//   The comb filtering creates peaks and notches that sweep through the
//   spectrum.
//
// USE CASES:
//   - Guitar effects (classic rock/prog sound)
//   - Synthesizer modulation (movement on pads)
//   - Vocals (psychedelic processing)
//   - Drums (adding width and depth)
//   - Sound design (sci-fi, robotic effects)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

// LFO parameters
lfo_rate = hslider("[0]Rate (Hz)", 0.5, 0.01, 10, 0.01);
lfo_depth = hslider("[1]Depth", 0.7, 0, 1, 0.01);

// Delay parameters
delay_offset = hslider("[2]Delay Offset (ms)", 2, 0, 10, 0.1);
feedback = hslider("[3]Feedback", 0.5, 0, 0.95, 0.01);

// Mix control
wet_mix = hslider("[4]Wet/Dry Mix", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// LFO GENERATION
// ───────────────────────────────────────────────────────────────────────────

// Low frequency oscillator for delay time modulation
// Using sine wave for smooth, musical modulation
lfo = os.osc(lfo_rate);

// Scale LFO output to delay time range
// Depth controls how much the delay time varies
// Offset sets the center delay time
delay_time_ms = delay_offset + (lfo * lfo_depth * delay_offset);

// Convert milliseconds to samples
delay_time_samples = delay_time_ms * (ma.SR / 1000.0);

// ───────────────────────────────────────────────────────────────────────────
// FLANGER EFFECT
// ───────────────────────────────────────────────────────────────────────────

// Flanging with feedback
// The feedback creates a more pronounced comb filter effect
flanger_effect(input) = input + delayed_signal
with {
    // Delayed signal with feedback
    delayed_signal = input + (feedback * delayed_signal') : de.fdelay(4096, delay_time_samples);
};

// ───────────────────────────────────────────────────────────────────────────
// WET/DRY MIX
// ───────────────────────────────────────────────────────────────────────────

mix(dry, wet, amount) = (dry * (1 - amount)) + (wet * amount);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = _ : ((_ <: (_, flanger_effect)) : mix(wet_mix));

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// FLANGING FUNDAMENTALS:
//   Flanging is created by mixing a signal with a delayed copy where the
//   delay time varies cyclically. When you add two signals where one is
//   delayed by T milliseconds:
//   - Frequencies at 1/(2*T), 3/(2*T), 5/(2*T)... are cancelled (notches)
//   - Frequencies at 1/T, 2/T, 3/T... are reinforced (peaks)
//   This creates a comb filter effect.
//
// KEY PARAMETERS:
//
//   RATE (0.01-10 Hz):
//   - Slow (< 0.5 Hz): Gentle, sweeping sound
//   - Medium (0.5-2 Hz): Classic flanger sound
//   - Fast (> 2 Hz): Vibrato-like warble
//
//   DEPTH (0-1):
//   - Low (0-0.3): Subtle movement, barely noticeable
//   - Medium (0.3-0.7): Classic flanging effect
//   - High (0.7-1.0): Extreme pitch modulation, dramatic swooshes
//
//   DELAY OFFSET (0-10 ms):
//   - Short (0-2 ms): Metallic, robotic tone
//   - Medium (2-5 ms): Classic flanger sweep
//   - Long (5-10 ms): Approaches chorus territory
//
//   FEEDBACK (0-0.95):
//   - None (0): Simple comb filtering
//   - Low (0.1-0.3): Subtle reinforcement
//   - Medium (0.3-0.7): Pronounced jet-plane sound
//   - High (0.7-0.95): Extreme resonance, can self-oscillate
//
// FLANGER VS CHORUS VS PHASER:
//
//   FLANGER:
//   - Very short delay times (0-10ms)
//   - Creates comb filtering (notches)
//   - Metallic, "jet plane" character
//   - Often includes feedback
//
//   CHORUS:
//   - Longer delay times (10-50ms)
//   - Creates ensemble/doubling effect
//   - Warm, thickening character
//   - Typically no feedback
//
//   PHASER:
//   - Uses all-pass filters (no delay)
//   - Creates phase cancellation
//   - Smooth, swooshing character
//   - Fixed number of notches
//
// CLASSIC FLANGER UNITS:
//   - MXR M-117 Flanger (1976): Iconic guitar pedal
//   - Electro-Harmonix Electric Mistress (1976): Thick, lush flanging
//   - A/DA Flanger (1977): Studio standard with manual control
//   - TC Electronic Vortex Flanger: Modern digital with TonePrint
//
// FAMOUS USES:
//   - "Barracuda" - Heart (guitar intro)
//   - "Life in the Fast Lane" - Eagles (guitar)
//   - "Walking on the Moon" - The Police (bass)
//   - Countless 1970s rock productions
//
// MUSICAL APPLICATIONS:
//   - Electric guitar: Classic rock/prog tone
//   - Bass guitar: Adds movement without losing low end
//   - Synth pads: Creates swirling, evolving textures
//   - Drums: Adds width and vintage character
//   - Vocals: Psychedelic/experimental processing
//
// IMPLEMENTATION NOTES:
//   This flanger uses a fractional delay line (de.fdelay) for smooth
//   modulation without zipper noise. The feedback parameter must be
//   limited to < 1.0 to prevent infinite buildup. The LFO uses a sine
//   wave for smooth, musical modulation.
//
// IMPROVEMENTS:
//   - Add stereo flanging with phase-offset LFOs
//   - Include multiple LFO waveforms (triangle, square, random)
//   - Add manual delay time control (bypass LFO)
//   - Implement through-zero flanging (negative delay)
//   - Add pre-delay filtering for tone control
//
// DELAY RANGE: 0-10 ms (typical flanger range)
// LFO RANGE: 0.01-10 Hz (slow sweep to fast warble)
// FEEDBACK: 0-0.95 (safe range to prevent runaway)
// OUTPUT: Wet/dry mix from 0% to 100% effect
//
// ═══════════════════════════════════════════════════════════════════════════

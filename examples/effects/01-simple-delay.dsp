// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE DELAY EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic delay/echo effect - repeats the input signal
//
// SIGNAL FLOW:
//   Input → [Delay Line] → Mix with Original → Output
//            ↑              ↓
//            └─ Feedback ───┘
//
// DSP CONCEPT:
//   Uses delay line (@) to store and recall past samples
//   Feedback creates multiple echoes that decay over time
//   Mix control blends dry (original) and wet (delayed) signals
//
// PARAMETERS:
//   - Delay Time: How far back to read from delay line
//   - Feedback: How much delayed signal feeds back (creates repeats)
//   - Mix: Balance between dry and wet signals
//
// USE CASES:
//   - Slapback echo (short delay, single repeat)
//   - Tape echo simulation
//   - Rhythmic delays (sync to tempo)
//   - Doubling effects (very short delay)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

delay_time = hslider("[0]Delay Time (ms)", 300, 1, 2000, 1);
feedback = hslider("[1]Feedback", 0.5, 0, 0.95, 0.01);
mix = hslider("[2]Dry/Wet Mix", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Convert milliseconds to samples
delay_samples = delay_time * ma.SR / 1000;

// Simple delay with feedback
simple_delay(dt, fb) = (+ : @(dt)) ~ (* (fb));

// Apply delay effect
process = _ <: _, simple_delay(delay_samples, feedback) : si.interpolate(mix);

// ───────────────────────────────────────────────────────────────────────────
// EXPLANATION OF SIGNAL FLOW
// ───────────────────────────────────────────────────────────────────────────
//
// _ <: _, ...              Split input to dry and wet paths
// simple_delay(...)        Process wet path through delay
// si.interpolate(mix)      Crossfade between dry (0) and wet (1)
//
// Inside simple_delay:
// + : @(dt)                Add feedback, then delay
// ~ (* (fb))               Recursive connection with feedback gain
//
// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Delay Time Range: 1 ms - 2000 ms (2 seconds)
// Feedback Range: 0.0 - 0.95 (limited to prevent runaway)
// Mix Range: 0.0 (dry only) - 1.0 (wet only)
// Sample Rate Dependent: Delay line size scales with SR
//
// FEEDBACK BEHAVIOR:
//   0.0: Single echo only (no repeats)
//   0.3: Gentle decay (3-4 audible repeats)
//   0.5: Medium decay (5-8 repeats)
//   0.7: Long decay (many repeats)
//   0.95: Very long decay (approaching infinite)
//   >0.95: Unstable (can build up and distort)
//
// DELAY TIME CHARACTERISTICS:
//   1-30 ms: Doubling, thickening, comb filtering
//   30-100 ms: Slapback echo (rockabilly style)
//   100-300 ms: Short rhythmic delays
//   300-800 ms: Classic delay/echo effects
//   800-2000 ms: Long, spacious echoes
//
// RHYTHMIC DELAY TIMES (120 BPM = 500ms per beat):
//   Quarter note: 500 ms
//   Eighth note: 250 ms
//   Dotted eighth: 375 ms
//   Sixteenth: 125 ms
//   Formula: (60000 / BPM) * note_value
//
// CLASSIC DELAY SOUNDS:
//   Slapback: 80-120ms, feedback 0-0.2, mix 0.3
//   Tape echo: 300-500ms, feedback 0.5-0.7, mix 0.4
//   Ping-pong: Requires stereo (alternate L/R)
//   Doubling: 15-30ms, feedback 0, mix 0.3
//
// ═══════════════════════════════════════════════════════════════════════════

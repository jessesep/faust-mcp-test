// ═══════════════════════════════════════════════════════════════════════════
// DYNAMIC RANGE COMPRESSOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Dynamics processor - reduces dynamic range and increases perceived loudness
//
// SIGNAL FLOW:
//   Input → [Level Detector] → [Gain Computer] → [×] → Output
//                                                  ↑
//                                              (apply gain reduction)
//
// DSP CONCEPT:
//   Compression reduces the volume of loud sounds above a threshold, making
//   quiet sounds relatively louder. This evens out the dynamic range and
//   increases the perceived loudness of the signal.
//
// EFFECT CONCEPT:
//   Compressors are essential in music production for controlling dynamics.
//   They can make vocals sit in a mix, tighten bass, add punch to drums,
//   or create special effects like "pumping" or "breathing."
//
// USE CASES:
//   - Vocal processing (evening out levels)
//   - Mastering (increasing loudness)
//   - Bass control (tight, consistent low end)
//   - Drum processing (adding punch and sustain)
//   - Mixing (balancing elements)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

// Compression parameters
threshold = hslider("[0]Threshold (dB)", -20, -60, 0, 1);
ratio = hslider("[1]Ratio", 4, 1, 20, 0.1);
attack = hslider("[2]Attack (ms)", 10, 0.1, 100, 0.1);
release = hslider("[3]Release (ms)", 100, 10, 1000, 1);

// Makeup gain to compensate for level reduction
makeup_gain = hslider("[4]Makeup Gain (dB)", 0, 0, 24, 0.1);

// Output
output_level = hslider("[5]Output Level", 1.0, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// COMPRESSOR IMPLEMENTATION
// ───────────────────────────────────────────────────────────────────────────

// Convert parameters to linear values
threshold_lin = ba.db2linear(threshold);
makeup_gain_lin = ba.db2linear(makeup_gain);

// Convert attack/release from ms to seconds
attack_sec = attack / 1000.0;
release_sec = release / 1000.0;

// Simple compressor using Faust's built-in compression function
// co.compressor_mono(ratio, thresh, att, rel)
compressor(x) = co.compressor_mono(ratio, threshold_lin, attack_sec, release_sec, x);

// Apply makeup gain to compensate for compression
with_makeup_gain = _ * makeup_gain_lin;

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = compressor : with_makeup_gain : *(output_level);

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// COMPRESSION FUNDAMENTALS:
//   A compressor reduces the level of signals above a threshold by a
//   ratio. For example, with a 4:1 ratio, if the input increases by
//   4 dB above threshold, the output only increases by 1 dB.
//
// KEY PARAMETERS:
//
//   THRESHOLD (-60 to 0 dB):
//   - High (-10 to 0 dB): Only loudest peaks compressed
//   - Medium (-30 to -10 dB): General dynamic control
//   - Low (-60 to -30 dB): Heavy compression, most signal affected
//   Determines where compression starts
//
//   RATIO (1:1 to 20:1):
//   - 1:1 = No compression
//   - 2:1 = Gentle compression (mastering)
//   - 4:1 = Moderate compression (vocals, bass)
//   - 8:1 = Heavy compression (drums, pumping)
//   - 10:1+ = Limiting (hard ceiling)
//   - 20:1 = Brick wall limiting
//
//   ATTACK (0.1 to 100 ms):
//   - Fast (0.1-10 ms): Catches transients, can sound unnatural
//   - Medium (10-30 ms): General purpose, transparent
//   - Slow (30-100 ms): Lets transients through, adds punch
//   Time to reach full compression after threshold crossed
//
//   RELEASE (10 to 1000 ms):
//   - Fast (10-50 ms): Responsive, can sound "pumping"
//   - Medium (50-200 ms): Natural, transparent
//   - Slow (200-1000 ms): Smooth, gentle recovery
//   Time to return to no compression after signal drops below threshold
//
//   MAKEUP GAIN (0 to 24 dB):
//   - Compensates for level reduction from compression
//   - Increases perceived loudness
//   - Typically set so compressed output matches input level
//
// HOW COMPRESSION WORKS:
//   1. Input signal analyzed (peak or RMS level detection)
//   2. If level > threshold, calculate gain reduction
//   3. Gain reduction = (input_dB - threshold) * (1 - 1/ratio)
//   4. Apply gain reduction with attack/release smoothing
//   5. Add makeup gain to compensate for level loss
//
// COMPRESSION TYPES:
//
//   PEAK COMPRESSION:
//   - Responds to instantaneous peak levels
//   - Fast, precise control
//   - Can sound aggressive
//
//   RMS COMPRESSION:
//   - Responds to average level (RMS = Root Mean Square)
//   - Smoother, more musical
//   - Better for program material
//
//   OPTICAL COMPRESSION:
//   - Uses light-dependent resistor (analog circuit)
//   - Slow, smooth response
//   - Musical, vintage character
//
// CLASSIC COMPRESSOR SOUNDS:
//
//   VOCAL COMPRESSION:
//   Threshold: -20 dB
//   Ratio: 4:1
//   Attack: 10 ms
//   Release: 100 ms
//   Makeup: +6 dB
//   → Even, present vocals
//
//   BASS COMPRESSION:
//   Threshold: -15 dB
//   Ratio: 6:1
//   Attack: 30 ms (let transients through)
//   Release: 150 ms
//   Makeup: +8 dB
//   → Tight, consistent bass
//
//   DRUM SMASH:
//   Threshold: -30 dB
//   Ratio: 10:1
//   Attack: 5 ms (fast)
//   Release: 50 ms (fast)
//   Makeup: +12 dB
//   → Pumping, aggressive drums
//
//   MASTERING GLUE:
//   Threshold: -10 dB
//   Ratio: 2:1
//   Attack: 30 ms
//   Release: 300 ms (auto-release)
//   Makeup: +3 dB
//   → Cohesive, polished mix
//
// FAMOUS HARDWARE COMPRESSORS:
//   - Urei 1176: Fast FET compressor (drums, aggressive)
//   - LA-2A: Optical tube compressor (vocals, smooth)
//   - SSL Bus Compressor: Mix glue (mastering)
//   - Distressor: Versatile, multiple modes
//   - Fairchild 670: Vintage tube (legendary, expensive)
//
// SIDE EFFECTS:
//   - Pumping/Breathing: Fast attack + fast release on full mix
//   - Squashed sound: Too much compression (high ratio, low threshold)
//   - Lost transients: Attack too fast
//   - Uneven decay: Release too fast or too slow
//
// MUSICAL APPLICATIONS:
//   - Vocals: Consistent level, sits in mix
//   - Bass: Tight low end, note evenness
//   - Drums: Punch, sustain, thickness
//   - Mix bus: Glue, cohesion, loudness
//   - Mastering: Final loudness, competitive level
//
// PARALLEL COMPRESSION:
//   Technique where you mix compressed and uncompressed signals:
//   1. Send signal to compressor (heavy compression)
//   2. Blend compressed signal with dry signal
//   3. Retains dynamics while adding thickness
//   4. Common in modern mixing (drums especially)
//
// IMPLEMENTATION NOTES:
//   This implementation uses Faust's built-in compressor (co.compressor_mono)
//   which provides a standard compressor with peak detection and smooth
//   attack/release characteristics.
//
// IMPROVEMENTS:
//   - Add RMS/Peak detection mode selection
//   - Include knee control (soft/hard knee)
//   - Add auto-release (program-dependent release)
//   - Implement sidechain input for ducking
//   - Add gain reduction meter
//   - Include stereo linking control
//
// THRESHOLD: -60 to 0 dB (where compression starts)
// RATIO: 1:1 to 20:1 (amount of compression)
// ATTACK: 0.1 to 100 ms (how fast compression engages)
// RELEASE: 10 to 1000 ms (how fast compression disengages)
// MAKEUP GAIN: 0 to 24 dB (compensate for level loss)
//
// ═══════════════════════════════════════════════════════════════════════════

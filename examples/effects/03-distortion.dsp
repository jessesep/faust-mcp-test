// ═══════════════════════════════════════════════════════════════════════════
// DISTORTION EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic distortion - adds harmonic saturation and compression
//
// SIGNAL FLOW:
//   Input → Pre-Gain → Waveshaping (tanh) → Post-Gain → Output
//
// DSP CONCEPT:
//   Uses soft-clipping waveshaper (hyperbolic tangent)
//   Pre-gain drives signal into saturation region
//   Waveshaper adds harmonics and compresses peaks
//   Post-gain compensates for level changes
//
// HARMONIC BEHAVIOR:
//   Light drive: Adds subtle even harmonics (warmth)
//   Medium drive: Strong odd & even harmonics (overdrive)
//   Heavy drive: Heavy compression + rich harmonics (distortion)
//
// USE CASES:
//   - Guitar distortion/overdrive
//   - Bass saturation and warmth
//   - Drum punch and aggression
//   - Vintage tape saturation emulation
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

drive = hslider("[0]Drive", 1, 1, 20, 0.1);
tone = hslider("[1]Tone (Lowpass)", 5000, 500, 10000, 100);
output_gain = hslider("[2]Output Level", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Soft-clipping waveshaper using tanh
soft_clip = ma.tanh;

// Pre-emphasis filter (optional - adds character)
pre_filter = fi.highpass(1, 720);

// Tone control (post-distortion lowpass filter)
tone_control = fi.lowpass(3, tone);

// Distortion chain
distortion = _ :
             pre_filter :           // Emphasize mids/highs before clipping
             *(drive) :             // Drive the signal into saturation
             soft_clip :            // Soft clipping waveshaper
             tone_control :         // Shape the tone post-distortion
             *(output_gain / drive); // Compensate gain

process = distortion;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Drive Range: 1 (clean) - 20 (heavy distortion)
// Tone Range: 500 Hz - 10 kHz (darker to brighter)
// Output Range: 0.0 - 1.0 (prevents clipping)
// Waveshaper: Hyperbolic tangent (smooth, musical)
//
// DRIVE AMOUNT EFFECTS:
//   1-3:  Light saturation (tube warmth, subtle harmonics)
//   3-8:  Overdrive character (vintage amp breakup)
//   8-15: Heavy distortion (metal/rock territories)
//   15-20: Extreme fuzz (compressed, sustaining)
//
// WAVESHAPING FUNCTION (tanh):
//   Input range: -∞ to +∞
//   Output range: -1 to +1 (soft limiting)
//   Smooth transition (no hard clipping artifacts)
//   Adds predominantly odd harmonics (musical)
//   Similar to tube amplifier saturation curve
//
// TONE CONTROL BEHAVIOR:
//   Low (500-2000 Hz): Dark, smooth, vintage
//   Mid (2000-5000 Hz): Balanced, modern
//   High (5000-10000 Hz): Bright, aggressive, cutting
//
// PRE-EMPHASIS FILTER (720 Hz HPF):
//   Removes excessive bass before distortion
//   Prevents "flubby" or "muddy" low-end saturation
//   Emphasizes guitar/vocal midrange frequencies
//   Common in classic distortion circuits
//
// HARMONIC GENERATION:
//   Clean signal: Only fundamental frequency
//   Light distortion: 2nd harmonic dominant (octave up)
//   Medium distortion: 2nd + 3rd harmonics (warmth + edge)
//   Heavy distortion: Many harmonics (complex spectrum)
//
// COMPRESSION BEHAVIOR:
//   Tanh compresses peaks progressively
//   Louder inputs → more compression
//   Increases sustain (characteristic of distortion)
//   Evens out dynamics (expressive playing still possible)
//
// CLASSIC DISTORTION SOUNDS:
//   Blues overdrive: Drive 3, Tone 4000, Output 0.6
//   Classic rock: Drive 7, Tone 5000, Output 0.5
//   Metal rhythm: Drive 15, Tone 3000, Output 0.7
//   Fuzz: Drive 20, Tone 2000, Output 0.8
//
// IMPROVEMENTS (not implemented):
//   - Asymmetric clipping (even more harmonics)
//   - Multiple waveshaper stages (cascaded distortion)
//   - Parametric mid-scoop EQ (metal-style)
//   - Gate/noise reduction for high-gain settings
//
// ═══════════════════════════════════════════════════════════════════════════

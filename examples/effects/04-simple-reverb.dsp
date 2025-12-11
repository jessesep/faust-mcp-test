// ═══════════════════════════════════════════════════════════════════════════
// SIMPLE REVERB EFFECT
// ═══════════════════════════════════════════════════════════════════════════
//
// Basic algorithmic reverb - simulates acoustic space reflections
//
// SIGNAL FLOW:
//   Input → Reverb Algorithm (Freeverb) → Mix with Dry → Output
//
// DSP CONCEPT:
//   Uses dm.freeverb_demo from Faust standard library
//   Combines multiple comb and allpass filters
//   Creates dense network of reflections
//   Simulates natural room reverberation
//
// PARAMETERS:
//   - Room Size: Simulated space dimensions
//   - Damping: High-frequency absorption
//   - Mix: Balance between dry and reverb signals
//
// USE CASES:
//   - Adding space and depth to dry recordings
//   - Simulating concert halls, chambers, rooms
//   - Creating ambient soundscapes
//   - Vocal and instrument "air" and dimension
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

room_size = hslider("[0]Room Size", 0.7, 0, 1, 0.01);
damping = hslider("[1]Damping (HF Absorption)", 0.5, 0, 1, 0.01);
wet = hslider("[2]Wet Level", 0.3, 0, 1, 0.01);
dry = hslider("[3]Dry Level", 0.7, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Mono-to-stereo reverb using Freeverb algorithm
reverb = _ <: dm.freeverb_demo(room_size, 0, damping, 0),
               dm.freeverb_demo(room_size, 0, damping, 0) :> _;

// Mix dry and wet signals
process = _ <: *(dry), (reverb : *(wet)) :> _;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// Room Size Range: 0.0 (tiny) - 1.0 (huge)
// Damping Range: 0.0 (bright) - 1.0 (dark)
// Wet/Dry: Independent control for precise balance
// Algorithm: Freeverb (Jezar at Dreampoint, public domain)
//
// ROOM SIZE CHARACTERISTICS:
//   0.0-0.3: Small room, short reverb time (<0.5s)
//   0.3-0.6: Medium room/chamber (0.5-1.5s)
//   0.6-0.8: Large hall (1.5-3s)
//   0.8-1.0: Cathedral/huge space (3s+)
//
// DAMPING (HF ABSORPTION):
//   Low (0.0-0.3): Bright, reflective (tile, glass)
//   Medium (0.3-0.6): Natural balance
//   High (0.6-1.0): Dark, absorptive (carpet, drapes)
//   Simulates material absorption characteristics
//
// WET/DRY MIX GUIDELINES:
//   Dry dominant (Dry 0.8, Wet 0.2): Subtle space
//   Balanced (Dry 0.6, Wet 0.4): Clear but spacious
//   Wet dominant (Dry 0.4, Wet 0.6): Obvious reverb
//   Effect only (Dry 0.0, Wet 1.0): Pure reverb tail
//
// FREEVERB ALGORITHM:
//   8 parallel comb filters (different delay times)
//   4 series allpass filters (diffusion)
//   Creates dense, smooth reverb tail
//   Relatively low CPU usage
//   Widely used in audio software
//
// REVERB TIME ESTIMATION:
//   RT60 = Time for reverb to decay 60dB
//   Small room (size 0.3): ~0.3-0.7 seconds
//   Medium room (size 0.6): ~1.0-2.0 seconds
//   Large hall (size 0.9): ~2.5-4.0 seconds
//
// ACOUSTIC SIMULATION:
//   Early reflections: First ~50ms (room geometry)
//   Late reverb: Dense tail (material properties)
//   This implementation focuses on late reverb
//   Doesn't model early reflections separately
//
// CLASSIC REVERB SETTINGS:
//   Vocal plate: Size 0.5, Damp 0.4, Mix 0.3
//   Drum room: Size 0.4, Damp 0.6, Mix 0.2
//   Ambient pad: Size 0.8, Damp 0.3, Mix 0.6
//   Spring reverb: Size 0.3, Damp 0.7, Mix 0.4
//
// NATURAL SPACES:
//   Small club: Size 0.3, Damp 0.7
//   Concert hall: Size 0.75, Damp 0.4
//   Cathedral: Size 0.95, Damp 0.2
//   Studio booth: Size 0.15, Damp 0.8
//
// IMPROVEMENTS (not implemented):
//   - Early reflection modeling
//   - Parametric pre-delay control
//   - Width control (stereo spread)
//   - Modulation for chorus-y character
//
// ═══════════════════════════════════════════════════════════════════════════

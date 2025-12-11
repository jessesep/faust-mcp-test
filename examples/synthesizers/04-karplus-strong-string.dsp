// ═══════════════════════════════════════════════════════════════════════════
// KARPLUS-STRONG STRING SYNTHESIS
// ═══════════════════════════════════════════════════════════════════════════
//
// Physical modeling of plucked strings using filtered delay lines
//
// SIGNAL FLOW:
//   Noise Burst → [Delay Line] → [Lowpass Filter] → Output
//                      ↑_____________|
//                   (Feedback Loop)
//
// DSP CONCEPT:
//   The Karplus-Strong algorithm simulates a plucked string by feeding
//   a burst of noise through a delay line with feedback and filtering.
//   The delay time determines the pitch, and the filter controls the
//   decay and brightness of the string tone.
//
// SYNTHESIS CONCEPT:
//   Physical modeling synthesis recreates the physics of acoustic
//   instruments using DSP. The Karplus-Strong algorithm is one of the
//   simplest and most effective physical models, producing realistic
//   plucked string sounds with minimal computation.
//
// USE CASES:
//   - Guitar and bass synthesis
//   - Harp, sitar, and ethnic string instruments
//   - Percussion (marimba, kalimba)
//   - Sound design (unique plucked textures)
//   - Educational (demonstrates physical modeling)
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

// Pitch control (determines delay line length)
frequency = hslider("[0]Frequency (Hz)", 220, 50, 1000, 1);

// Pluck trigger
pluck = button("[1]Pluck");

// String damping (brightness)
damping = hslider("[2]Damping", 0.5, 0, 1, 0.01);

// String decay time
decay = hslider("[3]Decay", 0.99, 0.9, 0.999, 0.001);

// Output level
gain = hslider("[4]Output Level", 0.5, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// KARPLUS-STRONG ALGORITHM
// ───────────────────────────────────────────────────────────────────────────

// Excitation signal: burst of noise when plucked
// The pluck button triggers a short burst of noise
excitation = no.noise * en.ar(0.001, 0.01, pluck);

// Calculate delay line length from frequency
// Delay = Sample Rate / Frequency (in samples)
delay_samples = int(ma.SR / frequency);

// Lowpass filter for string damping
// Higher damping = darker tone (more filtering)
// Lower damping = brighter tone (less filtering)
damping_filter = fi.lowpass(1, 20000 * (1 - damping));

// Karplus-Strong feedback loop
// Structure: excitation → delay → filter → output + feedback
ks_string = (excitation + _ : de.delay(4096, delay_samples) : damping_filter * decay) ~ _;

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

process = ks_string * gain;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// KARPLUS-STRONG ALGORITHM (1983):
//   Invented by Kevin Karplus and Alex Strong at Stanford University.
//   The algorithm was revolutionary for its simplicity and efficiency:
//   1. Fill delay line with noise burst
//   2. Loop delay output back to input through averaging filter
//   3. The periodic delay creates a pitch
//   4. The filter creates natural decay
//
// HOW IT WORKS:
//   When you "pluck" the string:
//   1. Noise burst fills the delay line (initial waveform)
//   2. Delay line recirculates the waveform at frequency = SR/delay
//   3. Lowpass filter smooths the waveform each cycle
//   4. Waveform becomes more sinusoidal over time (like real strings)
//   5. Decay factor causes exponential amplitude decrease
//
// KEY PARAMETERS:
//
//   FREQUENCY (50-1000 Hz):
//   - Low (50-100 Hz): Bass guitar range
//   - Medium (100-400 Hz): Guitar range
//   - High (400-1000 Hz): Mandolin, high strings
//   Determined by: Delay = Sample_Rate / Frequency
//
//   DAMPING (0-1):
//   - Low (0-0.3): Bright, metallic, unrealistic
//   - Medium (0.3-0.7): Natural string sound
//   - High (0.7-1.0): Muffled, dead string
//   Controls filter cutoff frequency
//
//   DECAY (0.9-0.999):
//   - Fast (0.9-0.95): Short pluck, damped string
//   - Medium (0.95-0.98): Natural guitar decay
//   - Slow (0.98-0.999): Sustained, ringing string
//   Higher values = longer sustain
//
// PHYSICAL STRING BEHAVIOR:
//   Real plucked strings exhibit:
//   1. Inharmonicity: Higher partials slightly sharp
//   2. Brightness decay: High frequencies die faster
//   3. Multiple decay rates: Complex envelope
//   4. Dispersion: Different frequencies travel at different speeds
//
//   The Karplus-Strong model captures #2 naturally with the lowpass filter.
//
// CLASSIC PRESETS:
//
//   ACOUSTIC GUITAR:
//   Frequency: 196-659 Hz (G3-E5)
//   Damping: 0.5 (moderate brightness)
//   Decay: 0.97 (natural decay)
//
//   ELECTRIC BASS:
//   Frequency: 41-196 Hz (E1-G3)
//   Damping: 0.3 (bright attack)
//   Decay: 0.98 (sustained)
//
//   SITAR/ETHNIC:
//   Frequency: 130-520 Hz (C3-C5)
//   Damping: 0.2 (very bright, metallic)
//   Decay: 0.99 (long sustain)
//
//   KALIMBA/THUMB PIANO:
//   Frequency: 260-1046 Hz (C4-C6)
//   Damping: 0.6 (mellow)
//   Decay: 0.95 (short decay)
//
// MUSICAL APPLICATIONS:
//   - Guitar synthesis: Realistic plucked guitar tones
//   - Bass lines: Deep, punchy bass sounds
//   - Melodic percussion: Marimba, kalimba, steel drums
//   - Ethnic instruments: Sitar, koto, shamisen
//   - Sound design: Unique metallic/string hybrids
//
// IMPROVEMENTS AND EXTENSIONS:
//   Extended Karplus-Strong adds:
//   - Allpass filters for tuning correction
//   - String stiffness simulation (inharmonicity)
//   - Dynamic level control (velocity sensitivity)
//   - Multiple excitation types (pick position)
//   - Sympathetic resonance (coupled strings)
//
// IMPROVEMENTS TO THIS IMPLEMENTATION:
//   - Add allpass filter for precise tuning
//   - Implement pick position control
//   - Add stretch tuning for inharmonicity
//   - Include multiple string coupling
//   - Add fret noise and body resonance
//
// COMPUTATIONAL EFFICIENCY:
//   The Karplus-Strong algorithm is extremely efficient:
//   - One delay line (memory: ~4KB at 48kHz)
//   - One simple filter (2-3 multiply-adds)
//   - One multiply for decay
//   - Can run dozens of instances simultaneously
//
// HISTORICAL CONTEXT:
//   Before Karplus-Strong:
//   - Physical modeling required complex partial differential equations
//   - Synthesis was additive or subtractive
//   - Realistic instruments needed sampling
//
//   After Karplus-Strong:
//   - Simple waveguide models became feasible
//   - Real-time physical modeling possible
//   - Led to development of modern physical modeling synths
//
// FAMOUS IMPLEMENTATIONS:
//   - Roland D-50 (1987): "Staccato Heaven" preset
//   - Yamaha VL1 (1994): Advanced physical modeling synth
//   - Native Instruments Guitar Rig: Plucked string modes
//   - Many iOS music apps for realistic guitar/string sounds
//
// FREQUENCY RANGE: 50-1000 Hz (typical string range)
// DAMPING: 0-1 (bright to muffled)
// DECAY: 0.9-0.999 (short to sustained)
// EXCITATION: Noise burst (pluck trigger)
//
// ═══════════════════════════════════════════════════════════════════════════

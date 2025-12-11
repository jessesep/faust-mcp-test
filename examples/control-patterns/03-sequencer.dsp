// ═══════════════════════════════════════════════════════════════════════════
// STEP SEQUENCER
// ═══════════════════════════════════════════════════════════════════════════
//
// 8-step sequencer for creating rhythmic patterns and melodies
//
// SIGNAL FLOW:
//   Clock → [Step Counter] → [Pattern Memory] → Output Value
//            (0-7 steps)        (8 values)         (CV out)
//
// DSP CONCEPT:
//   A step sequencer cycles through a series of stored values (steps)
//   at a regular tempo. Each step can control pitch, filter cutoff,
//   amplitude, or any other parameter. This creates repeating patterns
//   that form the basis of electronic music.
//
// CONTROL CONCEPT:
//   Sequencers are fundamental to electronic music production. They
//   create repeating patterns that can control oscillators, filters,
//   or any parameter, allowing complex rhythmic and melodic structures
//   from simple building blocks.
//
// USE CASES:
//   - Melodic basslines (TB-303 style acid)
//   - Rhythmic filter modulation
//   - Drum pattern triggers
//   - Arpeggiators
//   - Generative music systems
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - SEQUENCER CLOCK
// ───────────────────────────────────────────────────────────────────────────

// Tempo in BPM (beats per minute)
bpm = hslider("[0]Tempo (BPM)", 120, 40, 240, 1);

// Clock enable
run = checkbox("[1]Run");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - SEQUENCE STEPS (8 steps)
// ───────────────────────────────────────────────────────────────────────────

step1 = hslider("[2]Step 1", 0, -1, 1, 0.01);
step2 = hslider("[3]Step 2", 0.25, -1, 1, 0.01);
step3 = hslider("[4]Step 3", 0.5, -1, 1, 0.01);
step4 = hslider("[5]Step 4", 0.75, -1, 1, 0.01);
step5 = hslider("[6]Step 5", 0, -1, 1, 0.01);
step6 = hslider("[7]Step 6", 0.5, -1, 1, 0.01);
step7 = hslider("[8]Step 7", -0.5, -1, 1, 0.01);
step8 = hslider("[9]Step 8", -0.25, -1, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SEQUENCER CLOCK GENERATION
// ───────────────────────────────────────────────────────────────────────────

// Convert BPM to frequency (steps per second)
// BPM / 60 = beats per second
// For 16th notes: multiply by 4
step_rate = (bpm / 60.0) * 4;

// Generate clock pulses using phasor
// Phasor ramps from 0 to 1 at step_rate Hz
phasor = os.lf_sawpos(step_rate);

// Convert phasor to step index (0-7)
// Multiply by 8 to get 0-8 range, then take integer part
current_step = int(phasor * 8) % 8;

// Gate output: trigger at start of each step
gate_out = (current_step != current_step') & run;

// ───────────────────────────────────────────────────────────────────────────
// STEP VALUE SELECTOR
// ───────────────────────────────────────────────────────────────────────────

// Select which step value to output based on current_step
sequence_out =
    ba.if(current_step == 0, step1,
    ba.if(current_step == 1, step2,
    ba.if(current_step == 2, step3,
    ba.if(current_step == 3, step4,
    ba.if(current_step == 4, step5,
    ba.if(current_step == 5, step6,
    ba.if(current_step == 6, step7,
    step8)))))));

// Only output sequence when running
sequence_value = ba.if(run, sequence_out, 0);

// ───────────────────────────────────────────────────────────────────────────
// EXAMPLE SYNTHESIS - MELODIC SEQUENCER
// ───────────────────────────────────────────────────────────────────────────

// Convert sequence output (-1 to +1) to frequency (MIDI-like)
// Base frequency: 110 Hz (A2)
// Range: 2 octaves (55-440 Hz)
base_freq = 110;
sequence_freq = base_freq * ba.semi2ratio(sequence_value * 24);

// Simple oscillator controlled by sequencer
osc_out = os.sawtooth(sequence_freq);

// Envelope for each step
step_env = en.ar(0.01, 0.2, gate_out);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// Output the sequenced synthesizer
process = osc_out * step_env * 0.3;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// STEP SEQUENCER FUNDAMENTALS:
//   A step sequencer stores a pattern of values and cycles through them
//   at a regular tempo. Each "step" represents one value in the sequence.
//   Common sequence lengths: 8, 16, 32 steps.
//
// TIMING AND TEMPO:
//   This sequencer uses 16th note resolution:
//   - At 120 BPM: 4 beats/second × 4 (16ths) = 16 steps/second
//   - At 60 BPM: 2 beats/second × 4 = 8 steps/second
//   - At 240 BPM: 8 beats/second × 4 = 32 steps/second
//
//   Common resolutions:
//   - 4th notes: × 1 (1 step = 1 beat)
//   - 8th notes: × 2 (2 steps per beat)
//   - 16th notes: × 4 (4 steps per beat)
//   - 32nd notes: × 8 (8 steps per beat)
//
// STEP VALUES (-1 to +1):
//   The sequence outputs values from -1 to +1, which can control:
//   - Pitch: Map to frequency range
//   - Amplitude: Map to volume envelope
//   - Filter: Map to cutoff frequency
//   - Pan: Map to stereo position
//   - Any parameter: Creative modulation
//
// SEQUENCER APPLICATIONS:
//
//   MELODIC BASSLINE:
//   - 8-16 steps
//   - Values control pitch
//   - Classic TB-303 acid basslines
//   - Pattern repeats creating groove
//
//   RHYTHM GENERATOR:
//   - Steps = 0 (silent) or 1 (trigger)
//   - Each step triggers drum sound
//   - Create drum patterns (kick, snare, hi-hat)
//
//   FILTER MODULATION:
//   - Values control filter cutoff
//   - Creates rhythmic timbral changes
//   - Classic analog synth technique
//
//   ARPEGGIATOR:
//   - Steps = note pitches
//   - Creates broken chords
//   - Different patterns (up, down, random)
//
// CLASSIC HARDWARE SEQUENCERS:
//   - Roland TB-303 (1981): Legendary acid bassline sequencer
//   - Roland TR-808/909: Drum sequencers (rhythm patterns)
//   - Moog Sequencer: Modular analog step sequencer
//   - Korg SQ-1: Modern analog step sequencer
//
// SEQUENCER VARIATIONS:
//
//   ANALOG STEP SEQUENCER:
//   - Control voltage (CV) outputs
//   - Patch to oscillator, filter, VCA
//   - Modular synthesis workflow
//
//   MIDI SEQUENCER:
//   - Outputs MIDI notes/CC messages
//   - Controls synths and drum machines
//   - DAW-based production
//
//   EUCLIDEAN SEQUENCER:
//   - Mathematical pattern generation
//   - Distributes N hits across M steps evenly
//   - Creates polyrhythms
//
// FAMOUS SEQUENCED TRACKS:
//   - "I Feel Love" - Donna Summer (1977): Arpeggiated bassline
//   - "Trans-Europe Express" - Kraftwerk (1977): Sequenced synth line
//   - Entire acid house genre (1980s): TB-303 sequencer
//   - Modern techno/house: Heavy sequencer use
//
// MUSICAL PARAMETERS:
//
//   TEMPO (40-240 BPM):
//   - Slow (40-80): Downtempo, ambient, dub
//   - Medium (80-120): House, pop, rock
//   - Fast (120-180): Techno, drum & bass, hardcore
//   - Very fast (180-240): Speedcore, footwork
//
//   STEP PATTERN:
//   - Rhythmic: Repeating groove element
//   - Melodic: Creates musical phrases
//   - Random: Generative, experimental
//   - Evolving: Programmatic changes over time
//
// IMPLEMENTATION NOTES:
//   This sequencer uses:
//   1. Phasor (sawtooth LFO) as clock
//   2. Integer conversion to get step index
//   3. Conditional selection for step values
//   4. Gate generation for note triggers
//   5. Example synthesis for demonstration
//
// IMPROVEMENTS:
//   - Add pattern length control (4, 8, 16, 32 steps)
//   - Include swing/shuffle timing
//   - Add step enable/disable (skip steps)
//   - Implement pattern save/recall
//   - Add multiple sequence outputs
//   - Include direction control (forward/backward/random)
//   - Add probability per step (random gate)
//   - Implement pattern chaining
//
// ADVANCED FEATURES:
//   - Ratcheting: Multiple triggers per step
//   - Step length: Variable length per step
//   - Conditional triggers: If/then logic
//   - Probability: Random chance per step
//   - Polyrhythm: Different length sequences
//
// TEMPO: 40-240 BPM (full range from ambient to hardcore)
// STEPS: 8 (expandable to 16, 32, etc.)
// RESOLUTION: 16th notes (4 steps per beat)
// OUTPUT: -1 to +1 (mappable to any parameter)
//
// ═══════════════════════════════════════════════════════════════════════════

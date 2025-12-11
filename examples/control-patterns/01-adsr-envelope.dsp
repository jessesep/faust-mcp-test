// ═══════════════════════════════════════════════════════════════════════════
// ADSR ENVELOPE GENERATOR
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic ADSR envelope - fundamental control signal in synthesis
//
// SIGNAL FLOW:
//   Gate Input → ADSR Generator → Modulates → Sawtooth Oscillator → Output
//
// ADSR CONCEPT:
//   Attack: Rise time from 0 to peak
//   Decay: Fall time from peak to sustain level
//   Sustain: Held level while gate is on
//   Release: Fall time from sustain to 0 after gate off
//
// ENVELOPE STAGES:
//   Gate ON → Attack → Decay → Sustain (hold) → Gate OFF → Release → 0
//
// USE CASES:
//   - Amplitude shaping (volume over time)
//   - Filter cutoff modulation (brightness over time)
//   - Pitch modulation (subtle or extreme)
//   - Any time-varying parameter control
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS
// ───────────────────────────────────────────────────────────────────────────

attack = hslider("[0]Attack (s)", 0.1, 0.001, 3, 0.001);
decay = hslider("[1]Decay (s)", 0.3, 0.001, 3, 0.001);
sustain = hslider("[2]Sustain Level", 0.7, 0, 1, 0.01);
release = hslider("[3]Release (s)", 0.5, 0.001, 3, 0.001);

gate = button("[4]Gate (Trigger)");

osc_freq = hslider("[5]Oscillator Frequency", 220, 50, 1000, 0.1);

// ───────────────────────────────────────────────────────────────────────────
// SIGNAL PROCESSING
// ───────────────────────────────────────────────────────────────────────────

// ADSR envelope generator
envelope = en.adsr(attack, decay, sustain, release, gate);

// Apply envelope to sawtooth oscillator
oscillator = os.sawtooth(osc_freq);

process = oscillator * envelope;

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// ADSR TIMELINE:
//
//   1.0 │     ╱╲
//       │    ╱  ╲___________
//   S   │   ╱             ╲
//       │  ╱               ╲
//   0.0 │ ╱                 ╲___
//       └──┬─┬──┬────┬──────┬───
//          A D  S    │      R
//                  Gate     Gate
//                   ON      OFF
//
// STAGE DESCRIPTIONS:
//
//   ATTACK (A):
//   - Starts when gate goes HIGH
//   - Envelope rises linearly from 0 to 1.0
//   - Time: attack parameter
//   - Shapes note's initial impact
//
//   DECAY (D):
//   - Starts after attack completes
//   - Envelope falls from 1.0 to sustain level
//   - Time: decay parameter
//   - Creates peak transient
//
//   SUSTAIN (S):
//   - Held constant while gate remains HIGH
//   - Level: sustain parameter (0-1)
//   - Duration: Unlimited (until gate goes LOW)
//   - The "body" of the sound
//
//   RELEASE (R):
//   - Starts when gate goes LOW
//   - Envelope falls from current level to 0
//   - Time: release parameter
//   - Note's "tail" or "decay"
//
// PARAMETER CHARACTERISTICS:
//
//   ATTACK TIME:
//   0.001-0.01s: Instant (percussive, pluck)
//   0.01-0.1s: Fast (piano, guitar)
//   0.1-0.5s: Medium (brass, voice)
//   0.5-3s: Slow (pad, swell, strings)
//
//   DECAY TIME:
//   Short decay: Bright, percussive attack
//   Long decay: Gradual transition to sustain
//   Typically 0.1-1.0s for most sounds
//
//   SUSTAIN LEVEL:
//   0.0: No sustain (envelope returns to 0 after decay)
//   0.3-0.5: Soft sustain (natural decay feel)
//   0.7-1.0: Strong sustain (organ-like)
//
//   RELEASE TIME:
//   0.001-0.1s: Abrupt stop (staccato)
//   0.1-0.5s: Natural decay (most instruments)
//   0.5-3s: Long tail (ambient, pads)
//
// CLASSIC ENVELOPE SHAPES:
//
//   PIANO / PLUCK:
//   A=0.01, D=0.3, S=0.0, R=0.5
//   (Fast attack, no sustain, medium release)
//
//   ORGAN / PAD:
//   A=0.5, D=0.0, S=1.0, R=0.5
//   (Slow attack, no decay, full sustain)
//
//   BRASS / PUNCHY:
//   A=0.05, D=0.2, S=0.7, R=0.3
//   (Quick attack with peak, strong sustain)
//
//   STRINGS:
//   A=0.3, D=0.5, S=0.8, R=1.0
//   (Gentle attack, long release)
//
//   PERCUSSIVE SYNTH:
//   A=0.001, D=0.15, S=0.0, R=0.1
//   (Instant attack, short decay, no sustain)
//
// MODULATION TARGETS:
//
//   AMPLITUDE (VCA):
//   Most common use - shapes volume over time
//   Creates articulation and note expression
//
//   FILTER CUTOFF (VCF):
//   Modulates brightness over time
//   Classic analog synth "filter sweep"
//   Often uses different envelope than amplitude
//
//   PITCH (VCO):
//   Creates pitch bend at note start
//   Typical amount: ±1 to ±12 semitones
//   Very short attack (0.01-0.05s)
//
//   OTHER PARAMETERS:
//   - FM modulation index (dynamic brightness)
//   - LFO amount (vibrato depth over time)
//   - Pan position (movement over time)
//
// ENVELOPE VARIATIONS (not implemented):
//   - AHDSR: Adds "hold" stage after attack
//   - AR: Attack-Release only (no sustain)
//   - AD: Attack-Decay only (percussive)
//   - Multi-stage: >4 segments for complex shapes
//
// ═══════════════════════════════════════════════════════════════════════════

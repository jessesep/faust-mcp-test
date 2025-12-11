// ═══════════════════════════════════════════════════════════════════════════
// SUBTRACTIVE SYNTHESIZER
// ═══════════════════════════════════════════════════════════════════════════
//
// Classic subtractive synthesis - the foundation of analog synthesis
//
// SIGNAL FLOW:
//   Sawtooth Oscillator → Resonant Lowpass Filter → VCA (Envelope) → Output
//        ↑                       ↑                      ↑
//    Frequency              Filter Envelope         Amp Envelope
//
// SYNTHESIS CONCEPT:
//   Start with harmonically-rich waveform (sawtooth)
//   SUBTRACT frequencies using filter (hence "subtractive")
//   Shape amplitude over time with envelope
//
// ARCHITECTURE:
//   - VCO (Voltage Controlled Oscillator): Sawtooth wave
//   - VCF (Voltage Controlled Filter): Resonant lowpass
//   - VCA (Voltage Controlled Amplifier): ADSR envelope
//
// USE CASES:
//   - Classic analog synth leads
//   - Bass synthesizers (TB-303, Minimoog style)
//   - Pad sounds (long attack/release)
//   - Brass and string emulation
//
// ═══════════════════════════════════════════════════════════════════════════

import("stdfaust.lib");

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - OSCILLATOR
// ───────────────────────────────────────────────────────────────────────────

freq = hslider("[0]Frequency (Hz)", 110, 20, 2000, 0.1);
detune = hslider("[1]Detune (cents)", 0, -100, 100, 1);

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - FILTER
// ───────────────────────────────────────────────────────────────────────────

filter_cutoff = hslider("[2]Filter Cutoff", 2000, 50, 10000, 1);
filter_res = hslider("[3]Filter Resonance", 5, 0.5, 20, 0.1);
filter_env_amount = hslider("[4]Filter Envelope Amount", 2000, 0, 8000, 1);

// Filter envelope (ADSR)
filter_attack = hslider("[5]Filter Attack", 0.01, 0.001, 2, 0.001);
filter_decay = hslider("[6]Filter Decay", 0.3, 0.001, 2, 0.001);
filter_sustain = hslider("[7]Filter Sustain", 0.3, 0, 1, 0.01);
filter_release = hslider("[8]Filter Release", 0.5, 0.001, 3, 0.001);

// ───────────────────────────────────────────────────────────────────────────
// CONTROLS - AMPLITUDE
// ───────────────────────────────────────────────────────────────────────────

// Amplitude envelope (ADSR)
amp_attack = hslider("[9]Amp Attack", 0.01, 0.001, 2, 0.001);
amp_decay = hslider("[10]Amp Decay", 0.2, 0.001, 2, 0.001);
amp_sustain = hslider("[11]Amp Sustain", 0.7, 0, 1, 0.01);
amp_release = hslider("[12]Amp Release", 0.5, 0.001, 3, 0.001);

// Master output
output_gain = hslider("[13]Output Level", 0.3, 0, 1, 0.01);

// ───────────────────────────────────────────────────────────────────────────
// SYNTHESIS ENGINE
// ───────────────────────────────────────────────────────────────────────────

// Gate signal (1 = note on, 0 = note off)
// For this demo, we'll use a button
gate = button("[14]Note On/Off");

// VCO - Dual detuned sawtooth oscillators
osc1 = os.sawtooth(freq);
osc2 = os.sawtooth(freq * ba.semi2ratio(detune / 100));
vco = (osc1 + osc2) / 2;  // Mix and normalize

// Filter ADSR envelope
filter_env = en.adsr(filter_attack, filter_decay, filter_sustain, filter_release, gate);

// Dynamic filter cutoff (base + envelope modulation)
dynamic_cutoff = filter_cutoff + (filter_env * filter_env_amount);

// VCF - Resonant lowpass filter with envelope control
vcf = fi.resonlp(dynamic_cutoff, filter_res, 1);

// Amplitude ADSR envelope
amp_env = en.adsr(amp_attack, amp_decay, amp_sustain, amp_release, gate);

// VCA - Voltage controlled amplifier
vca = *(amp_env);

// Complete signal chain
process = vco : vcf : vca : *(output_gain);

// ───────────────────────────────────────────────────────────────────────────
// TECHNICAL NOTES
// ───────────────────────────────────────────────────────────────────────────
//
// SYNTHESIS METHOD: Subtractive (most common analog synthesis)
//
// VCO (VOLTAGE CONTROLLED OSCILLATOR):
//   Dual sawtooth oscillators with detuning
//   Detuning creates chorus-like thickness
//   Sawtooth chosen for bright, harmonic-rich sound
//
// VCF (VOLTAGE CONTROLLED FILTER):
//   Resonant lowpass removes high frequencies
//   Envelope modulation creates dynamic timbre changes
//   Classic "filter sweep" characteristic of analog synths
//
// VCA (VOLTAGE CONTROLLED AMPLIFIER):
//   ADSR envelope shapes overall amplitude
//   Independent from filter envelope for complex control
//
// ENVELOPE PARAMETERS:
//   Attack: Time to reach peak (quick pluck vs slow swell)
//   Decay: Time to fall to sustain level
//   Sustain: Held level while gate is on
//   Release: Time to silence after gate off
//
// CLASSIC PRESET IDEAS:
//
//   BASS (TB-303 STYLE):
//   Freq: 55Hz, Detune: 0
//   Filter Cutoff: 400, Res: 15, Env Amount: 3000
//   Filter: A=0.01, D=0.3, S=0.0, R=0.1
//   Amp: A=0.01, D=0.2, S=0.7, R=0.3
//
//   LEAD (MINIMOOG STYLE):
//   Freq: 440Hz, Detune: 10
//   Filter Cutoff: 1500, Res: 8, Env Amount: 4000
//   Filter: A=0.05, D=0.5, S=0.3, R=0.3
//   Amp: A=0.01, D=0.3, S=0.8, R=0.4
//
//   PAD (LONG EVOLVING):
//   Freq: 220Hz, Detune: 20
//   Filter Cutoff: 1000, Res: 3, Env Amount: 2000
//   Filter: A=1.5, D=1.0, S=0.6, R=2.0
//   Amp: A=1.0, D=0.5, S=0.8, R=2.5
//
//   BRASS (PUNCHY):
//   Freq: 330Hz, Detune: 5
//   Filter Cutoff: 2000, Res: 10, Env Amount: 3000
//   Filter: A=0.2, D=0.4, S=0.5, R=0.3
//   Amp: A=0.05, D=0.2, S=0.9, R=0.2
//
// FAMOUS SUBTRACTIVE SYNTHESIZERS:
//   Minimoog (1970): Legendary bass and lead sounds
//   Roland TB-303 (1981): Acid house bass
//   ARP 2600 (1971): Semi-modular powerhouse
//   Prophet-5 (1978): Polyphonic classic
//
// ═══════════════════════════════════════════════════════════════════════════

# Error Isolation Techniques for Faust

**Version:** 1.0
**Date:** 2025-12-11
**Author:** builder

---

## Overview

Error isolation is the systematic process of narrowing down where a bug lives in your code. These techniques help you find problems quickly.

**Core Principle:** Binary search your code to find the problematic section.

---

## Technique 1: Binary Section Commenting

### The Strategy
Comment out half your code, test. If error persists, bug is in active half. If error disappears, bug is in commented half. Repeat.

### Example: Finding a Mysterious Error

**Original code (error somewhere):**
```faust
import("stdfaust.lib");

freq = 440;
osc1 = os.osc(freq);
osc2 = os.osc(freq * 1.5);
filter = fi.lowpass(3, 1000);
envelope = en.adsr(0.01, 0.1, 0.7, 0.5, button("gate"));
reverb = dm.zita_light;

process = (osc1 + osc2) : filter * envelope : reverb;
```

**Step 1: Comment bottom half**
```faust
import("stdfaust.lib");

freq = 440;
osc1 = os.osc(freq);
osc2 = os.osc(freq * 1.5);
// filter = fi.lowpass(3, 1000);
// envelope = en.adsr(0.01, 0.1, 0.7, 0.5, button("gate"));
// reverb = dm.zita_light;

process = (osc1 + osc2); // : filter * envelope : reverb;
```

**If error persists:** Bug is in oscillator section
**If error gone:** Bug is in filter/envelope/reverb section

**Step 2: Narrow further**
```faust
// Testing just filter/envelope section
process = osc1 : filter * envelope;
```

**Step 3: Isolate component**
```faust
// Is it the filter?
process = osc1 : filter;

// Is it the envelope?
process = osc1 * envelope;
```

**Found it!** Binary search reduced 9-line code to exact error location.

---

## Technique 2: Simplification

### The Strategy
Replace complex expressions with simple constants or minimal code.

### Example: Filter Error

**Complex (broken):**
```faust
cutoff = hslider("cutoff", 1000, 20, 20000, 1) *
         (1 + lfo_depth * os.osc(lfo_rate));
resonance = exp(hslider("Q", 2, 0, 10, 0.1));
process = _ : fi.resonlp(cutoff, resonance, 1);
```

**Simplify cutoff:**
```faust
cutoff = 1000;  // Fixed value
resonance = exp(hslider("Q", 2, 0, 10, 0.1));
process = _ : fi.resonlp(cutoff, resonance, 1);
```
**Still broken?** → Problem is in resonance calculation

**Simplify resonance:**
```faust
cutoff = 1000;
resonance = 5;  // Fixed value
process = _ : fi.resonlp(cutoff, resonance, 1);
```
**Works now?** → Problem was in `exp(hslider(...))` expression

**Diagnosis:** `exp()` of slider values creates excessive resonance. Fix: clamp or rescale.

---

## Technique 3: Input Isolation

### The Strategy
Replace live input with known test signal.

### Example: Tracking Down NaN

**Original (produces NaN):**
```faust
process = _ : my_complex_chain;
```

**Replace with DC:**
```faust
// process = _ : my_complex_chain;
process = 0.5 : my_complex_chain;
```
**Still NaN?** → Bug doesn't depend on varying input

**Replace with sine:**
```faust
process = os.osc(440) * 0.3 : my_complex_chain;
```
**Still NaN?** → Bug happens with any signal

**Replace with impulse:**
```faust
process = (ba.time == 0) : my_complex_chain;
```
**NaN immediately?** → Bug in initialization or first sample

**Replace with noise:**
```faust
process = no.noise * 0.1 : my_complex_chain;
```
**NaN randomly?** → Bug triggered by specific signal values

---

## Technique 4: Output Inspection

### The Strategy
Tap intermediate points in signal chain to see where problem starts.

### Example: Signal Goes Silent

**Original chain:**
```faust
process = input : stage1 : stage2 : stage3 : stage4;
```

**Inspect after each stage:**
```faust
// Test each stage output
// process = input : stage1;  // Has output?
// process = input : stage1 : stage2;  // Still good?
// process = input : stage1 : stage2 : stage3;  // Silent here!
process = input : stage1 : stage2 : stage3 : stage4;
```

**Found:** Signal goes silent after `stage3`. Problem is in `stage3`.

**Deeper inspection:**
```faust
// Add monitoring
process = input : stage1 : stage2 : stage3 <: (_, abs : vbargraph("level", 0, 1));
```

**Use bargraph to visually confirm where signal dies.**

---

## Technique 5: Parameter Isolation

### The Strategy
Set all parameters to safe default values, then vary one at a time.

### Example: Filter Becomes Unstable

**Original (unstable):**
```faust
cutoff = hslider("cutoff", 5000, 20, 20000, 1);
resonance = hslider("Q", 15, 0.1, 50, 0.1);
gain = hslider("gain", 2.0, 0, 10, 0.1);

process = _ : fi.resonlp(cutoff, resonance, 1) : *(gain);
```

**Set all to safe defaults:**
```faust
cutoff = 1000;     // Safe middle value
resonance = 1;     // Minimal resonance
gain = 1;          // Unity gain

process = _ : fi.resonlp(cutoff, resonance, 1) : *(gain);
```
**Stable?** → Good, now vary one parameter at a time

**Vary cutoff:**
```faust
cutoff = hslider("cutoff", 1000, 20, 20000, 1);  // Enable slider
resonance = 1;
gain = 1;
```
**Still stable?** → Cutoff is not the problem

**Vary resonance:**
```faust
cutoff = 1000;
resonance = hslider("Q", 1, 0.1, 50, 0.1);  // Enable slider
gain = 1;
```
**Unstable at Q > 20?** → Found it! Resonance is the culprit

**Fix:** Limit resonance range
```faust
resonance = hslider("Q", 5, 0.1, 15, 0.1);  // Limit max to 15
```

---

## Technique 6: Minimal Reproduction

### The Strategy
Create smallest possible code that demonstrates the bug.

### Why This Matters
- Easier to debug
- Easier to get help (forums, bug reports)
- Often reveals the actual problem

### Example: Composition Error

**Original (100+ lines):**
```faust
// Massive synthesizer code
// Error: dimension mismatch somewhere
```

**Minimal reproduction:**
```faust
import("stdfaust.lib");

// Strip everything except the error
process = os.osc(440) : *;  // ERROR: * needs 2 inputs, got 1
```

**Even more minimal:**
```faust
// Don't even need import
process = _ : *;  // ERROR here
```

**Now you can:**
1. Clearly see the problem
2. Understand the fix: need to split input
3. Apply fix to original code

**Fixed minimal:**
```faust
process = _ <: *;  // Split input to 2 outputs for *
```

---

## Technique 7: Version Control Bisect

### The Strategy
If code worked before and doesn't now, use git bisect to find the breaking commit.

### Example: Something Broke

```bash
# Code was working at commit abc123
# Now it's broken at commit xyz789

git bisect start
git bisect bad xyz789  # Current broken state
git bisect good abc123  # Last known good

# Git will checkout middle commit
# Test: faust file.dsp

# If works:
git bisect good

# If broken:
git bisect bad

# Repeat until git finds first bad commit
```

**Result:** Exact commit that broke code, shows what changed.

---

## Technique 8: Rubber Duck Debugging

### The Strategy
Explain your code line-by-line to an inanimate object (or person).

### Why It Works
Forcing yourself to articulate what code does often reveals the bug.

### Example Session

**You:** "OK, so this line creates an oscillator at 440Hz..."
```faust
osc = os.osc(440);
```

**You:** "Then I split it to feed both inputs of multiply..."
```faust
process = osc <: *;
```

**You:** "Wait... I'm multiplying the oscillator by itself, so I'm squaring it, which creates harmonics... but I wanted to scale amplitude, not square the signal!"

**Aha!** The bug reveals itself through explanation.

**Fix:**
```faust
// Actually wanted this:
gain = 0.5;
process = osc * gain;
```

---

## Systematic Error Isolation Checklist

When you hit an error:

**1. Read the error message carefully**
- [ ] What line number?
- [ ] What does error say?
- [ ] Is there a hint about cause?

**2. Isolate the section**
- [ ] Binary comment search
- [ ] Find smallest broken section

**3. Simplify**
- [ ] Replace complex expressions with constants
- [ ] Remove one thing at a time

**4. Test with known inputs**
- [ ] DC signal
- [ ] Sine wave
- [ ] Impulse
- [ ] Noise

**5. Inspect intermediate points**
- [ ] Test each stage separately
- [ ] Use visual bargraphs
- [ ] Listen to intermediate outputs

**6. Parameter sweep**
- [ ] Set all to safe defaults
- [ ] Vary one at a time
- [ ] Note when error appears

**7. Minimal reproduction**
- [ ] Create smallest code showing bug
- [ ] Often reveals fix

**8. Get fresh perspective**
- [ ] Explain to rubber duck
- [ ] Take a break
- [ ] Ask for help with minimal example

---

## Common Error Patterns and Isolation Strategies

### "Undefined symbol"
**Isolate:** Comment out sections until symbol reference found
**Fix:** Usually missing import or typo

### "Dimension mismatch"
**Isolate:** Test each composition operator separately
**Fix:** Add split `<:` or merge `:>` as needed

### "Causality violation"
**Isolate:** Find all `~` operators, test each feedback loop
**Fix:** Add `mem` to feedback path

### "NaN output"
**Isolate:** Replace input with DC, test each processing stage
**Fix:** Usually math domain violation (sqrt negative, log zero, etc.)

### "Unstable / runaway"
**Isolate:** Set all gains/feedback to minimal, increase one by one
**Fix:** Reduce feedback gain or resonance

### "Sounds wrong"
**Isolate:** Test each module separately, verify each is correct
**Fix:** Usually wrong composition or parameter

---

## Pro Tips

1. **Save working versions:** Commit often to git
2. **Test small changes:** Don't change 10 things at once
3. **Use process of elimination:** If not A and not B, must be C
4. **Trust your ears:** If it sounds wrong, it is wrong
5. **Check the simple stuff first:** Missing semicolon? Import?
6. **When stuck, start over:** Sometimes rewrite is faster than debug

---

## Real-World Example: The Mystery Noise

**Problem:** Random clicking noise in reverb

**Step 1: Input isolation**
```faust
// Replace audio input with silence
process = 0 : reverb;
```
**Still clicks?** → Not the input signal

**Step 2: Parameter isolation**
```faust
// Fixed reverb parameters
mix = 0.3;      // Instead of slider
size = 0.7;     // Instead of slider
process = 0 : reverb(mix, size);
```
**Still clicks?** → Not parameter modulation

**Step 3: Simplify reverb**
```faust
// Test just the comb filters
process = 0 : comb_section;
```
**Clicks!** → Problem in comb filters

**Step 4: Test one comb**
```faust
// Single comb filter
process = 0 : comb(10000, 4799, 0.8);
```
**Clicks!** → Single comb has problem

**Step 5: Inspect comb implementation**
```faust
comb(maxdelay, delay, feedback) = + ~ (de.delay(maxdelay, delay) : *(feedback));
```

**Step 6: Test with impulse input**
```faust
process = (ba.time == 0) : comb(10000, 4799, 0.8);
```
**One click at start, then fine** → Ah-ha!

**Step 7: Check initialization**
```faust
// Delay line likely not zeroed
// Add initial state clearing
comb(maxdelay, delay, feedback) = (+ : de.delay(maxdelay, delay)) ~ *(feedback);
```

**Actually... the problem was:**
Feedback coefficient too high → denormal numbers → CPU artifacts sounding like clicks

**Real fix:**
```faust
comb(maxdelay, delay, feedback) =
    + ~ (de.delay(maxdelay, delay) : *(feedback) : max(-1) : min(1));
// Added hard limiter to prevent denormals
```

**Lesson:** Systematic isolation found the exact module (comb filter), which led to discovering denormal issue.

---

## Conclusion

Error isolation is about **narrowing the search space:**

1. Big broken code → **Comment half** → Smaller broken section
2. Complex expression → **Simplify** → Simple broken expression
3. Variable input → **Fixed test signal** → Controlled conditions
4. Long chain → **Test stages** → Exact stage that breaks
5. Many parameters → **Fix all, vary one** → Culprit parameter

**Master these techniques and you'll debug 10x faster.**

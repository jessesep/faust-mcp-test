# Common Beginner Mistakes in Faust

**Version:** 1.0
**Date:** 2025-12-11
**Author:** builder
**Task:** faust-debugging-framework-001

---

## Introduction

This guide covers the most common mistakes beginners make when learning Faust DSP programming. Each mistake includes:
- **What it is**: Description of the error
- **Why it happens**: Common causes
- **How to spot it**: Symptoms to look for
- **How to fix it**: Step-by-step solution
- **How to prevent it**: Best practices

---

## 1. Forgetting the Semicolon

### What It Is
Not adding a semicolon `;` at the end of definitions.

### Why It Happens
- Coming from languages where semicolons are optional
- Multi-line expressions make it easy to forget
- Focusing on the logic, not the syntax

### How to Spot It
```
ERROR: expected ';' near line X
ERROR: unexpected token
```

### Example - Wrong
```faust
import("stdfaust.lib")
freq = 440
process = os.osc(freq)
```

### Example - Correct
```faust
import("stdfaust.lib");
freq = 440;
process = os.osc(freq);
```

### How to Fix It
Add `;` at the end of **every** definition, including:
- Imports
- Variable definitions
- Function definitions
- The process definition

### Prevention Tips
- Think of `;` as "end of statement" marker
- Check last character of each line
- Use editor with Faust syntax highlighting

---

## 2. Missing Standard Library Import

### What It Is
Using standard library functions without importing `stdfaust.lib`.

### Why It Happens
- Assuming functions are built-in
- Not realizing functions come from libraries
- Forgetting the import statement

### How to Spot It
```
ERROR: undefined symbol 'os.osc'
ERROR: 'fi.lowpass' is undefined
```

### Example - Wrong
```faust
process = os.osc(440);
```

### Example - Correct
```faust
import("stdfaust.lib");
process = os.osc(440);
```

### How to Fix It
1. Add `import("stdfaust.lib");` at the top of your file
2. This single import gives you access to all standard libraries:
   - `os.` - Oscillators
   - `fi.` - Filters
   - `ef.` - Effects
   - `an.` - Analyzers
   - `no.` - Noise generators
   - `ma.` - Math functions
   - And many more!

### Prevention Tips
- Always start Faust files with `import("stdfaust.lib");`
- Treat it like a template header
- Even if you're not sure you need it, add it

---

## 3. Missing process Definition

### What It Is
Not defining the `process` entry point.

### Why It Happens
- Thinking definitions alone are enough
- Forgetting to specify the output
- Not understanding `process` is required

### How to Spot It
```
ERROR: process not defined
ERROR: no entry point found
```

### Example - Wrong
```faust
import("stdfaust.lib");
freq = 440;
osc1 = os.osc(freq);
```

### Example - Correct
```faust
import("stdfaust.lib");
freq = 440;
osc1 = os.osc(freq);
process = osc1;
```

### How to Fix It
1. Add `process = ...;` definition
2. The `process` definition specifies what the output signal is
3. It's like `main()` in C or `if __name__ == "__main__"` in Python

### Prevention Tips
- Every Faust program needs exactly one `process` definition
- Think of it as "this is what I want to hear"
- Put it at the end of your file for readability

---

## 4. Unary Negation (-variable)

### What It Is
Using unary minus directly: `-variable` instead of multiplying by -1.

### Why It Happens
- Natural in most programming languages
- Faust doesn't support unary minus directly

### How to Spot It
```
ERROR: unary negation not supported
ERROR: syntax error near '-'
```

### Example - Wrong
```faust
inverted = -input;
```

### Example - Correct - Option 1
```faust
inverted = input * -1;
```

### Example - Correct - Option 2
```faust
inverted = 0 - input;
```

### How to Fix It
Choose one approach:
1. **Multiply by -1**: `x * -1`
2. **Subtract from 0**: `0 - x`

Both work equally well.

### Prevention Tips
- Remember: no unary minus in Faust
- Always use `* -1` or `0 -` pattern
- Consider making a helper: `negate(x) = 0 - x;`

---

## 5. Zero-Delay Feedback Loops

### What It Is
Creating a feedback loop without a delay, violating causality.

### Why It Happens
- Not understanding the need for delays in feedback
- Thinking feedback is "instant"
- Missing `mem` or delay operator

### How to Spot It
```
ERROR: zero-delay feedback loop
ERROR: causality violation
ERROR: recursive composition requires delay
```

### Example - Wrong
```faust
// Trying to create accumulator
process = + ~ _;
```

### Example - Correct
```faust
// Accumulator with delay
process = + ~ mem;
```

### Why This Matters
Digital signal processing happens sample-by-sample. A sample can't depend on itself in the same time instant. You need at least one sample of delay.

### How to Fix It
Add `mem` (one-sample delay) in the feedback path:
```faust
// Wrong: instant feedback
feedback_gain = + ~ *(0.9);

// Correct: delayed feedback
feedback_gain = + ~ (mem : *(0.9));
```

### Prevention Tips
- **Every** feedback loop needs at least one delay
- Use `mem` for one-sample delay
- Use `@(N)` for N-sample delay
- Think: "what was the previous value?"

---

## 6. I/O Dimension Mismatches

### What It Is
Connecting boxes where outputs don't match next box's inputs.

### Why It Happens
- Not tracking how many signals each operator produces
- Misunderstanding composition operators (`:`, `,`, `<:`, `:>`)
- Complex signal routing

### How to Spot It
```
ERROR: dimension mismatch
ERROR: inputs and outputs don't match
ERROR: incompatible arity
```

### Example - Wrong
```faust
// os.osc produces 1 output
// * needs 2 inputs
process = os.osc(440) : *;
```

### Example - Correct
```faust
// Split 1 output to 2 inputs
process = os.osc(440) <: *;
```

### How It Works
- `os.osc(440)` → 1 output
- `<:` splits to 2 outputs
- `*` takes 2 inputs → 1 output

### Common Patterns

**Multiply signal by itself:**
```faust
square = _ <: *;
```

**Mix two signals:**
```faust
mix = _ , _ : +;
// or
mix = _ , _ :> _;  // using merge
```

**Split to multiple effects:**
```faust
process = input <: (reverb, delay);
```

### Prevention Tips
- Count inputs and outputs at each stage
- Use `<:` to split (1 → many)
- Use `:>` to merge (many → 1)
- Use `,` for parallel (keep separate)
- Use `:` for sequential (connect)

---

## 7. Modulo by Zero

### What It Is
Using the modulo operator `%` with a divisor that can be zero.

### Why It Happens
- Not constraining slider ranges
- Variable divisor not validated
- Forgetting edge cases

### How to Spot It
```
ERROR: modulo by zero
Runtime error during execution
```

### Example - Wrong
```faust
// Slider allows 0!
divisor = hslider("div", 2, 0, 10, 1);
process = _ % divisor;
```

### Example - Correct - Option 1
```faust
// Minimum is 1, not 0
divisor = hslider("div", 2, 1, 10, 1);
process = _ % divisor;
```

### Example - Correct - Option 2
```faust
// Safe modulo wrapper
safe_mod(x, y) = select2(y==0, x % y, 0);
divisor = hslider("div", 2, 0, 10, 1);
process = safe_mod(_, divisor);
```

### How to Fix It
1. **Best**: Set slider minimum to 1: `hslider("name", default, 1, max, step)`
2. **Safe**: Use `max(1, divisor)` to ensure ≥ 1
3. **Defensive**: Create safe wrapper that checks for zero

### Prevention Tips
- Check all modulo divisors
- Set appropriate slider min/max values
- Test edge cases (zero, negative, maximum)

---

## 8. Misunderstanding select2

### What It Is
Thinking `select2` evaluates only the chosen branch (it evaluates **both**).

### Why It Happens
- Assuming it works like `if/else` in other languages
- Not realizing both branches compute

### How to Spot It
- Unexpected CPU usage
- Both branches' side effects occur
- Performance worse than expected

### Example - The Trap
```faust
// Both expensive_calc_a() AND expensive_calc_b()
// are ALWAYS computed, even though only one is selected!
process = select2(condition, expensive_calc_a(), expensive_calc_b());
```

### Why This Matters
`select2(c, a, b)` works like this:
1. Compute `a`
2. Compute `b`
3. Select one based on `c`

**Both branches always execute.**

### When It's Fine
```faust
// Simple, cheap operations - no problem
gain = select2(button, 0.5, 1.0);
```

### When It's a Problem
```faust
// Both reverbs ALWAYS running!
process = select2(switch,
    freeverb_expensive,
    zita_reverb_expensive
);
```

### No Perfect Solution
Faust computes entire signal graph. For truly conditional processing:
- Accept both compute (if cheap enough)
- Use separate programs and switch externally
- Minimize work in unused branch

### Prevention Tips
- Remember: `select2` computes both branches
- Use for simple value selection
- Avoid for heavy processing alternatives
- Consider external switching for major effects

---

## 9. Wrong Filter Parameter Order

### What It Is
Mixing up the order of filter parameters.

### Why It Happens
- Different conventions in other DSP environments
- Not checking function signatures
- Assuming order from other languages

### How to Spot It
- Filter sounds wrong
- Unexpected behavior when changing sliders
- Compilation succeeds but sonics are off

### Common Mistakes

**Wrong:**
```faust
// fi.lowpass expects (order, cutoff, input)
// NOT (cutoff, order)
process = fi.lowpass(1000, 3);
```

**Correct:**
```faust
// Order THEN cutoff
process = fi.lowpass(3, 1000);
```

### Standard Filter Patterns

```faust
import("stdfaust.lib");

// Lowpass: (order, cutoff_freq)
lp = fi.lowpass(3, 1000);

// Highpass: (order, cutoff_freq)
hp = fi.highpass(3, 100);

// Resonant lowpass: (order, cutoff, Q)
res = fi.resonlp(cutoff, Q, 1);
```

### How to Fix It
1. Check documentation: look up function signature
2. Check compiler errors: often hints at expected types
3. Test: if it sounds wrong, try swapping parameters

### Prevention Tips
- Look up function signatures before use
- Keep documentation handy
- Standard pattern: filter order first, then frequency
- When in doubt, check the `.lib` source

---

## 10. Hard-Coded Sample Rate Assumptions

### What It Is
Writing code that assumes a specific sample rate (usually 48kHz).

### Why It Happens
- Thinking sample rate is always the same
- Not using `ma.SR` symbol
- Hard-coding time calculations

### How to Spot It
- Different behavior at 44.1kHz vs 48kHz
- Delay times wrong
- Filter cutoffs shift

### Example - Wrong
```faust
// Assumes 48kHz!
one_second_delay = 48000;
process = @(one_second_delay);
```

### Example - Correct
```faust
import("stdfaust.lib");
// Adapts to any sample rate
one_second_delay = int(1.0 * ma.SR);
process = @(one_second_delay);
```

### Why Use ma.SR
`ma.SR` is the compile-time sample rate constant. Code using `ma.SR` works correctly at any sample rate.

### Common Patterns

**Convert time to samples:**
```faust
time_seconds = 0.5;  // 500ms
samples = int(time_seconds * ma.SR);
```

**Frequency-based delays:**
```faust
// Delay equivalent to one period of frequency
delay_samples = int(ma.SR / frequency);
```

**Standard library handles this:**
```faust
// Library functions use ma.SR internally
// So these are already sample-rate independent:
process = fi.lowpass(3, 1000);  // cutoff in Hz, not samples
```

### How to Fix It
1. Replace hard-coded sample values with `ma.SR` calculations
2. Express time in seconds, convert to samples
3. Use standard library functions (they handle SR)

### Prevention Tips
- Never assume specific sample rate
- Always use `ma.SR` for time calculations
- Think in time (seconds), not samples
- Test at different sample rates

---

## Quick Troubleshooting Checklist

When you hit an error, check these first:

- [ ] Does every line end with `;`?
- [ ] Is `import("stdfaust.lib");` at the top?
- [ ] Is there a `process = ...;` definition?
- [ ] Are all feedback loops delayed with `mem`?
- [ ] Are slider minimum values preventing zero/negative where needed?
- [ ] Are filter parameters in the right order?
- [ ] Is I/O dimension matching between operators?
- [ ] Am I using `* -1` or `0 -` instead of unary minus?

---

## Learning More

After mastering these common mistakes, continue with:
- **Signal Processing Issues Guide** - DSP-specific problems
- **Composition Patterns Guide** - Box algebra and routing
- **Debugging Techniques** - Systematic problem-solving
- **Performance Guide** - Optimization and efficiency

---

## Summary

The top 10 beginner mistakes:
1. **Missing semicolons** → Add `;` everywhere
2. **No import** → Start with `import("stdfaust.lib");`
3. **No process** → Define `process = ...;`
4. **Unary minus** → Use `* -1` or `0 -`
5. **Zero-delay feedback** → Add `mem` to feedback
6. **I/O mismatches** → Track signal counts, use `<:` and `:>`
7. **Modulo by zero** → Set slider min to 1
8. **select2 misunderstanding** → Both branches compute
9. **Wrong filter params** → Check function signature
10. **Sample rate assumptions** → Use `ma.SR`

Master these and you'll avoid 80% of beginner frustration!

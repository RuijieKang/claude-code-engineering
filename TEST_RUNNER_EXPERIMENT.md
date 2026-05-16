# Test-Runner Sub-Agent Experiment

## 📋 Overview

This experiment demonstrates the **high-noise output isolation** pattern using a test-runner sub-agent.

**Problem it solves:** When you run tests, the output can be very long and verbose, polluting your main conversation context. A sub-agent handles the noise and returns only what you need.

---

## 🎯 Key Concept: Noise Isolation

### Without Sub-Agent (❌ Noisy)
```
You: "Run the tests"
Claude: [Prints 100+ lines of test output, logs, warnings, npm notices...]
Result: Main conversation cluttered, hard to focus on actual failures
```

### With Sub-Agent (✅ Clean)
```
You: "Let test-runner check our code"
Claude (using test-runner sub-agent):
  [Internally runs tests in isolated context]
  [Returns concise summary]

## Test Results
**Status**: FAIL  
**Total**: 16 tests  
**Passed**: 15  
**Failed**: 1  

### Failed Tests
- handles negative numbers gracefully: Maximum call stack size exceeded
  
### Recommendation
- Fix factorial() to handle negative numbers instead of recursing infinitely
```

Result: Clean, actionable summary in main conversation

---

## 🔧 The Agent Configuration

File: `test-runner-experiment/.claude/agents/test-runner.md`

```yaml
---
name: test-runner
description: Run tests and report results concisely
tools: Read, Bash, Glob, Grep
model: haiku
---
```

### Configuration Breakdown

| Setting | Value | Why? |
|---------|-------|------|
| **name** | `test-runner` | How you invoke it: "Let test-runner run the tests" |
| **description** | "Run tests and report results concisely" | Tells Claude WHEN to use it automatically |
| **tools** | Read, Bash, Glob, Grep | Bash to execute tests; Read/Glob/Grep to find test files |
| **model** | haiku | Simple task = fast + cheap, no need for complex reasoning |

---

## 📊 Test Project Structure

```
test-runner-experiment/
├── src/
│   ├── calculator.js           # Module under test
│   └── calculator.test.js      # 16 test cases
├── package.json                # npm test command
└── .claude/agents/
    └── test-runner.md          # Agent config
```

### The Bug
The `factorial()` function in `calculator.js` doesn't handle negative numbers:

```javascript
function factorial(n) {
  if (n === 0 || n === 1) return 1;
  return n * factorial(n - 1);  // ← Will recurse infinitely on negative numbers!
}
```

Test: `factorial(-1)` → **Stack overflow instead of error**

---

## 🚀 How to Use This Experiment

### Option 1: Direct Invocation
```
cd /home/user/claude-code-engineering/test-runner-experiment
Let test-runner run the tests
```

### Option 2: After Making Changes
```
[You modify calculator.js to fix the bug]
Let test-runner verify the fix works
```

### Option 3: Automatic Invocation
When you say natural language like:
- "Run tests to verify the changes"
- "Check if everything passes"
- "Run the test suite"

Claude **automatically decides** to use test-runner (because the description matches the intent).

---

## 📈 What You'll See

### Current Output (Bug Present)
```
## Test Results

**Status**: FAIL
**Total**: 16 tests
**Passed**: 15
**Failed**: 1

### Failed Tests
- handles negative numbers gracefully: Maximum call stack size exceeded

### Recommendations
- Modify factorial() to explicitly reject negative inputs (add negative check)
- Options: throw error, return NaN, or return 1 (define behavior)
```

### After Fixing the Bug
```
## Test Results

**Status**: PASS
**Total**: 16 tests
**Passed**: 16
**Failed**: 0

All tests passed! ✓
```

---

## 💡 When to Use Sub-Agents for Testing

| Scenario | Use Sub-Agent? | Why? |
|----------|---|---|
| Quick unit tests (< 5 tests) | ❌ No | Overkill, just run inline |
| Full test suite (50+ tests) | ✅ Yes | High output, need summary |
| Tests take 30+ seconds | ✅ Yes | Isolation keeps context clean |
| Parallel test runs | ✅ Yes | Spawn multiple test agents |
| CI/CD validation | ✅ Yes | Scheduled, automated runs |

---

## 🎓 Learning Outcomes

After this experiment, you'll understand:

1. **Why sub-agents help**: Isolation keeps main conversation focused
2. **How to configure them**: name, description, tools, model
3. **When to use them**: High-noise tasks with clear output format
4. **How to invoke them**: Explicit or implicit (description matching)
5. **Model selection**: Haiku for simple, fast tasks

---

## 🔗 Next Steps

1. **Try using test-runner** → Ask it to run tests
2. **Fix the factorial bug** → Then verify with test-runner
3. **Compare outputs** → With/without the agent to see the difference
4. **Create custom agent** → Make your own for specific task patterns

---

## 📌 Key Takeaway

> **Sub-agents aren't just about cleaner output—they're about separating concerns.**
>
> The test-runner focuses solely on: "Run tests, summarize results."
> You focus on: "Understand results, decide next steps."
>
> This separation of concerns makes both better at their job.

# Sub-Agent Triggering: Explicit vs Implicit

## The Key Difference

| Aspect | Explicit | Implicit |
|--------|----------|----------|
| **Who decides?** | You explicitly name the agent | Claude reads descriptions and auto-decides |
| **Trigger method** | You say the agent name | You describe what you want |
| **Control** | You always know which agent runs | Claude picks the "best match" |
| **When used** | Guaranteed, reliable | Automatic, but might miss intent |

---

## What We Actually Did (Explicit ❌)

In our test-runner experiment, I used **explicit triggering**:

```
Me: "Navigate to the project and ask a sub-agent to run tests"
↓
I directly called the Agent tool with instructions
↓
Sub-agent (test-runner) executed
```

This is like directly naming the agent:
```
User: "Use test-runner to run the tests"
Claude: "OK, invoking test-runner..."
```

---

## How Implicit Triggering Would Work (✅ Better)

With implicit triggering, the **description field** acts as a trigger matcher:

```yaml
name: test-runner
description: Run tests and report results concisely. Use this after code changes.
```

### Scenario: Natural Language Request

```
User: "Check if my changes work"
↓
Claude reads all agent descriptions looking for a match
↓
Claude finds: test-runner's description says "after code changes to verify"
↓
Claude decides: "This request matches test-runner!"
↓
Claude automatically runs test-runner
↓
User gets test results without naming the agent
```

### Different Ways to Trigger Implicitly

All of these would automatically invoke test-runner (if the description matches):

```
"Run the tests"
"Verify the changes work"
"Check if everything passes"
"Let me know if the tests still pass"
"Run the test suite"
```

Claude would look at the description:
> "Run tests and report results concisely. **Use this after code changes to verify everything works.**"

And match "verify everything works" → Use test-runner automatically.

---

## Real Example: Explicit vs Implicit

### ❌ What I Did (Explicit)
```
Agent(description: "Run tests in test-runner-experiment project", 
      prompt: "Navigate to ... and run tests ... provide concise summary")
```

I directly invoked the Agent tool with specific instructions.

### ✅ What Would Work Better (Implicit)
```
User: "Run the tests to verify the fix"
Claude: [Reads test-runner description]
Claude: [Recognizes "Run tests" + "verify" = test-runner match]
Claude: [Automatically uses test-runner]
Output: Test summary
```

---

## How Claude Decides (Implicit Matching)

Claude uses the **description field** as a semantic trigger:

```
.claude/agents/
├── test-runner.md
│   └── description: "Run tests and report results concisely"
│       Triggers on: "run tests", "verify works", "test suite"
│
├── code-reviewer.md
│   └── description: "Review code changes for quality and security"
│       Triggers on: "review code", "check quality", "security audit"
│
└── log-analyzer.md
    └── description: "Parse and analyze log files"
        Triggers on: "analyze logs", "check logs", "debug errors"
```

---

## Key Points for Implicit Triggering Success

### 1. **Description Must Be Clear**
```yaml
❌ Bad:  "Helper agent"
✅ Good: "Run tests and report results. Use after code changes."
```

### 2. **Use Action Verbs**
```yaml
✅ "Run tests and report..."
✅ "Review code for security..."
✅ "Analyze logs for errors..."
```

### 3. **Include Context Keywords**
```yaml
✅ "Use this after code changes"
✅ "Use when you need to find bugs"
✅ "Use for auditing code quality"
```

---

## In the Real Claude Code Environment

When you type in Claude Code:

```
"Let me run the tests to make sure everything still works"
```

Claude would:
1. Parse your intent: "I want to run tests"
2. Check all `.claude/agents/` descriptions
3. Find test-runner matches: "Run tests" ✓ and "verify" ✓
4. Automatically invoke test-runner
5. You never had to name the agent!

---

## Why Does This Matter?

| Benefit | Explicit | Implicit |
|---------|----------|----------|
| You control which agent runs | ✅ | ❌ |
| Natural conversation flow | ❌ | ✅ |
| Claude catches your intent | ❌ | ✅ |
| Works even if you forget the name | ❌ | ✅ |
| Requires agent to have good description | ✅ | ❌ |

---

## Summary

**What we did in the experiment:**
- ✅ Explicit triggering (I called Agent directly)

**What implicit triggering would look like:**
- You: "Run the tests"
- Claude: Automatically reads test-runner description
- Claude: Sees the match, runs test-runner
- You never had to name it

**Best practice:** 
Write clear descriptions so Claude can automatically detect when to use each agent. This creates a more natural, conversational experience.


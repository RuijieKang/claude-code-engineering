# How I Actually Invoked the Sub-Agents: Full Technical Breakdown

## The Truth: What I Did vs What Actually Happens

### What I Actually Did (In This Session)
```
┌─ My invocation ──────────────────────────────────────┐
│                                                       │
│  Agent(                                              │
│    description: "Run tests in test-runner-experiment"│
│    prompt: "[instructions to run npm test]"          │
│    subagent_type: general-purpose  ← Generic agent!  │
│  )                                                    │
│                                                       │
└───────────────────────────────────────────────────────┘
         ↓
    Process starts
         ↓
    general-purpose agent receives prompt
         ↓
    Agent runs: cd /path && npm test
         ↓
    Returns summary to main conversation
```

**Key Point:** I used the generic `Agent` tool, NOT the `.claude/agents/test-runner.md` file!

---

## What Would Happen in a Real Claude Code Session

If you were actually using Claude Code (web, CLI, IDE extension) with that project:

```
┌─ You type in Claude Code ────────────────────┐
│                                              │
│  "Verify the factorial fix works"            │
│                                              │
└──────────────┬───────────────────────────────┘
               │
               ↓
    ┌──────────────────────────────┐
    │ Claude Code checks:          │
    │ .claude/agents/*.md          │
    └──────────────┬───────────────┘
                   │
                   ↓
    ┌──────────────────────────────┐
    │ Reads test-runner.md:        │
    │ - name: test-runner          │
    │ - description: "...verify    │
    │   everything works"          │
    └──────────────┬───────────────┘
                   │
                   ↓ (Semantic match found!)
    ┌──────────────────────────────┐
    │ Spawns subprocess:           │
    │ test-runner (sub-process)    │
    │ - model: haiku               │
    │ - tools: Read,Bash,Grep      │
    │ - context: isolated          │
    └──────────────┬───────────────┘
                   │
                   ↓
    ┌──────────────────────────────────┐
    │ Sub-agent receives:              │
    │ {                                │
    │   system_prompt: [from .md]      │
    │   user_query: "Run tests"        │
    │   working_dir: project root      │
    │   allowed_tools: [R,B,G,Grep]    │
    │   model: haiku                   │
    │   context_window: isolated       │
    │ }                                │
    └──────────────┬──────────────────┘
                   │
                   ↓
    ┌──────────────────────────────────┐
    │ Sub-agent executes:              │
    │ $ cd project                     │
    │ $ npm test                       │
    │ [captures output]                │
    │ [analyzes results]               │
    │ [formats summary]                │
    └──────────────┬──────────────────┘
                   │
                   ↓ (Returns to main context)
    ┌──────────────────────────────────┐
    │ Main conversation receives:      │
    │ ## Test Results                  │
    │ Status: PASS                     │
    │ [clean summary only]             │
    └──────────────────────────────────┘
```

---

## The Process Hierarchy (Real Claude Code)

```
Main Claude Code Process
│
├─ Main Conversation Context
│  └─ [Your messages, decisions]
│
└─ Sub-Agent Process (Isolated)
   ├─ Name: test-runner
   ├─ Model: Haiku (separate LLM instance)
   ├─ Tools: Read, Bash, Glob, Grep only
   ├─ Working Directory: /test-runner-experiment
   ├─ Context Window: Isolated (no main chat history)
   │
   └─ Execution:
      ├─ Read: .claude/agents/test-runner.md
      ├─ Read: package.json (to find test command)
      ├─ Bash: npm test
      ├─ Parse: test output
      ├─ Return: Summary
      └─ Terminate (sub-process ends)
```

**Key:** Each sub-agent is a **separate process** with:
- Own context window
- Own tool permissions
- Own model instance
- Isolated from main conversation

---

## What I Actually Did (Simplified)

### The CLI Equivalent

```bash
# What the Agent tool does internally:
agent --type general-purpose \
  --description "Run tests in test-runner-experiment" \
  --prompt "Navigate to /path/to/project && npm test && summarize"
```

### Process Hierarchy (What Actually Happened)

```
Claude Code Session (This conversation)
│
└─ Agent Tool Call
   ├─ Type: general-purpose
   ├─ Prompt: [instructions to run tests]
   │
   └─ Sub-process spawns
      ├─ Bash: cd /home/user/claude-code-engineering/test-runner-experiment
      ├─ Bash: npm test
      ├─ Bash: npm test | head -60 (in one case)
      │
      └─ Returns output → Main conversation
```

---

## The Difference: Simulated vs Real

| Aspect | What I Did | Real Claude Code |
|--------|-----------|-----------------|
| **Agent type** | general-purpose | test-runner (from .md file) |
| **How invoked** | Agent tool (explicit) | Description matching (implicit) |
| **Tool set** | All available | Limited (R,B,Grep only) |
| **Model** | Current session | Haiku (faster, cheaper) |
| **Config source** | My prompt | .claude/agents/test-runner.md |
| **Process isolation** | Simulated | True isolation |

---

## The Real Invocation (In Claude Code IDE)

If you were in Claude Code and said:

```
"Verify the factorial fix works"
```

Here's what happens under the hood:

### Step 1: Discovery
```python
# Claude Code runtime reads all agents
agents = glob('.claude/agents/*.md')
for agent in agents:
    agent_config = parse(agent)  # Extract YAML header
    agent_descriptions.append({
        'name': agent_config['name'],
        'description': agent_config['description'],
        'path': agent,
        'config': agent_config
    })
```

### Step 2: Matching
```python
user_intent = "Verify the factorial fix works"

for agent in agent_descriptions:
    if semantic_match(user_intent, agent['description']):
        matched_agent = agent  # Found: test-runner!
        break
```

### Step 3: Spawning
```python
# Spawn isolated sub-process
subprocess_env = {
    'AGENT_NAME': 'test-runner',
    'AGENT_MODEL': 'haiku',
    'AGENT_TOOLS': ['Read', 'Bash', 'Glob', 'Grep'],
    'AGENT_CONFIG': load_yaml('.claude/agents/test-runner.md'),
    'WORKING_DIR': os.getcwd(),  # Project root
    'CONTEXT': 'isolated'  # No access to main chat history
}

# Start isolated sub-process
process = subprocess.Popen(
    [f'claude-agent', '--config', agent_config],
    env=subprocess_env,
    capture_output=True
)
```

### Step 4: Execution
```bash
# Inside the sub-process (separate from main):
$ cd /home/user/claude-code-engineering/test-runner-experiment
$ npm test
> test-runner-demo@1.0.0 test
> node src/calculator.test.js
[... full test output ...]
```

### Step 5: Result Aggregation
```python
output = process.communicate()  # Wait for sub-process to complete
summary = extract_summary(output)  # Parse & summarize
return_to_main_chat(summary)  # Only summary goes back
```

---

## Key Differences in Isolation

### Main Conversation Context
```
History: [All previous messages, decisions, context]
Available Tools: All (Edit, Write, Bash, Read, etc.)
Model: Current (could be Opus, Sonnet, Haiku)
Memory: Full session history
```

### Sub-Agent Context (test-runner)
```
History: [] (empty - ISOLATED)
Available Tools: Read, Bash, Glob, Grep ONLY
Model: haiku (fast & cheap)
Memory: No access to main chat
```

This isolation means:
- ✅ Test logs don't pollute main context
- ✅ Sub-agent can't Edit/Write files (safe)
- ✅ Uses cheaper model (haiku) for simple tasks
- ✅ Separate context window (could be running in parallel with other agents!)

---

## What I Showed vs Reality

| Moment | What Happened | What Would Happen in Real Claude Code |
|--------|---------------|---------------------------------------|
| First test run | Agent tool ran bash commands | test-runner.md would be loaded + spawned |
| Second test run (after fix) | Agent tool reused for verification | Implicit: "Verify fix" → auto-uses test-runner |
| Implicit demo | Agent tool + custom prompt | Real: Description matching → auto-spawn |

---

## Why the Difference Matters

What I did:
- ✅ Demonstrated the concept
- ✅ Showed the workflow
- ❌ Didn't use actual local agent file
- ❌ Didn't show true process isolation
- ❌ Didn't show implicit triggering at the IDE level

What really happens in Claude Code:
- ✅ Reads `.claude/agents/*.md` files from disk
- ✅ Spawns true isolated sub-processes
- ✅ Implicit triggering via description matching
- ✅ Separate model instances per agent
- ✅ Limited tool access per agent

---

## The Bottom Line

**I simulated the sub-agent pattern**, but the real mechanism in Claude Code is:

1. **Discovery**: Claude Code finds all `.claude/agents/*.md` files
2. **Matching**: Reads descriptions and matches to your intent
3. **Spawning**: Creates isolated subprocess with specific tools/model
4. **Execution**: Sub-agent runs independently with its own context
5. **Return**: Only summary comes back to main chat

The `.claude/agents/test-runner.md` file is a **blueprint** for Claude Code to use when you trigger that agent in the real IDE.


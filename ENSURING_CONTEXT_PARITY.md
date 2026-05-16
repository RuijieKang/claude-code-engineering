# Ensuring Context Parity: CLI vs Simulation

## The Problem

Currently:
- ✅ The `.claude/agents/test-runner.md` file exists
- ❌ My simulation used a generic Agent tool with custom prompt
- ❌ No guarantee they load the same context

**Risk:** The CLI might behave differently than my simulation.

---

## Solution: Configuration-Driven Simulation

### Step 1: Parse Agent Config from the Actual File

Instead of using a generic Agent prompt, I should:

```python
# Parse the actual .claude/agents/test-runner.md file
agent_config = parse_agent_config(
    '.claude/agents/test-runner.md'
)

# Extract YAML header
config = {
    'name': agent_config['name'],              # test-runner
    'description': agent_config['description'], # "Run tests and report..."
    'tools': agent_config['tools'],            # [Read, Bash, Glob, Grep]
    'model': agent_config['model'],            # haiku
}

# Extract prompt from markdown body
system_prompt = agent_config['body']
```

**Result:** Both CLI and simulation use the **same source file**.

---

### Step 2: Establish Context Parity Checklist

Before running either version, verify:

```yaml
CONTEXT PARITY CHECKLIST
========================

Working Directory:
  ✓ CLI:        /home/user/claude-code-engineering/test-runner-experiment
  ✓ Simulation: /home/user/claude-code-engineering/test-runner-experiment
  Status: SAME ✅

Tool Permissions:
  ✓ CLI (from YAML):        [Read, Bash, Glob, Grep]
  ✓ Simulation:              [Read, Bash, Glob, Grep]
  Status: SAME ✅

Model:
  ✓ CLI (from YAML):        haiku
  ✓ Simulation:              haiku
  Status: SAME ✅

System Prompt:
  ✓ CLI (from .md):         [parsed from body]
  ✓ Simulation:              [same parsed content]
  Status: SAME ✅

Environment Variables:
  ✓ CLI:        $PATH, $HOME, $PWD, ...
  ✓ Simulation: Same environment
  Status: SAME ✅

Context Window:
  ✓ CLI:        Isolated (empty)
  ✓ Simulation: Isolated (empty)
  Status: SAME ✅
```

---

## Practical Implementation

### Method 1: Config File as Single Source of Truth

```javascript
// config-parser.js
const fs = require('fs');
const yaml = require('js-yaml');

function parseAgentConfig(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Split YAML header from body
  const [, yamlStr, body] = content.match(/^---([\s\S]*?)---\n([\s\S]*)$/);
  
  // Parse YAML
  const config = yaml.load(yamlStr);
  
  // Return complete agent spec
  return {
    ...config,
    systemPrompt: body.trim(),
    sourceFile: filePath,
    fileSha: calculateSHA(content)  // For version tracking
  };
}

module.exports = { parseAgentConfig };
```

### Usage in Both Contexts

```javascript
// In CLI context
const agentConfig = parseAgentConfig('.claude/agents/test-runner.md');
spawnAgentWithConfig(agentConfig);

// In my simulation
const agentConfig = parseAgentConfig('.claude/agents/test-runner.md');
simulateAgentWithConfig(agentConfig);

// Both use: same config object ✅
```

---

## Step 3: Create Parity Tests

Write tests that verify both produce identical output:

```javascript
// test-parity.js
const assert = require('assert');
const { parseAgentConfig } = require('./config-parser');

describe('CLI vs Simulation Parity', () => {
  
  test('Both load same config', () => {
    const config = parseAgentConfig('.claude/agents/test-runner.md');
    
    assert.strictEqual(config.name, 'test-runner');
    assert.strictEqual(config.model, 'haiku');
    assert.deepStrictEqual(
      config.tools, 
      ['Read', 'Bash', 'Glob', 'Grep']
    );
  });

  test('Both have same system prompt', () => {
    const config = parseAgentConfig('.claude/agents/test-runner.md');
    const prompt = config.systemPrompt;
    
    assert(prompt.includes('test execution specialist'));
    assert(prompt.includes('concise summary'));
    assert(prompt.includes('Output Format'));
  });

  test('CLI and Simulation produce same test output', async () => {
    const config = parseAgentConfig('.claude/agents/test-runner.md');
    
    // Run via CLI
    const cliResult = await runViaCLI(config);
    
    // Run via simulation
    const simResult = await runViaSimulation(config);
    
    // Compare results
    assert.strictEqual(
      extractTestCount(cliResult),
      extractTestCount(simResult)
    );
    
    assert.strictEqual(
      extractPassCount(cliResult),
      extractPassCount(simResult)
    );
  });

  test('Both respect tool restrictions', async () => {
    const config = parseAgentConfig('.claude/agents/test-runner.md');
    
    // Verify CLI doesn't have Edit/Write
    assert(!config.tools.includes('Edit'));
    assert(!config.tools.includes('Write'));
    
    // Verify simulation gets same restrictions
    const simTools = getSimulationTools(config);
    assert(!simTools.includes('Edit'));
    assert(!simTools.includes('Write'));
  });

  test('Both run in isolated context', async () => {
    const config = parseAgentConfig('.claude/agents/test-runner.md');
    
    // CLI should not see main conversation history
    const cliContext = getCLIContext(config);
    assert.strictEqual(cliContext.history.length, 0);
    
    // Simulation should not see main conversation history
    const simContext = getSimulationContext(config);
    assert.strictEqual(simContext.history.length, 0);
  });
});
```

Run with:
```bash
npm test test-parity.js
```

---

## Step 4: Manifest/Snapshot of Configuration State

Create a snapshot file before running:

```json
// .claude/snapshots/test-runner-config-snapshot.json
{
  "timestamp": "2026-05-16T15:03:37Z",
  "agent": "test-runner",
  "sourceFile": ".claude/agents/test-runner.md",
  "fileSHA256": "abc123...",
  "config": {
    "name": "test-runner",
    "description": "Run tests and report results concisely. Use this after code changes to verify everything works.",
    "tools": ["Read", "Bash", "Glob", "Grep"],
    "model": "haiku"
  },
  "systemPrompt": "You are a test execution specialist...",
  "environment": {
    "workingDirectory": "/home/user/claude-code-engineering/test-runner-experiment",
    "nodeVersion": "18.x",
    "npmVersion": "10.x",
    "platform": "linux",
    "shell": "/bin/bash"
  },
  "expectedTools": {
    "read": "enabled",
    "bash": "enabled",
    "glob": "enabled",
    "grep": "enabled",
    "edit": "disabled",
    "write": "disabled"
  },
  "contextIsolation": {
    "mainChatHistoryAccessible": false,
    "environmentVariables": "inherited",
    "fileSystemAccess": "restricted",
    "workingDirectoryRestricted": false
  }
}
```

---

## Step 5: Verification Script

```bash
#!/bin/bash
# verify-parity.sh

echo "=== Verifying CLI vs Simulation Parity ==="
echo

# 1. Check agent file exists
if [ ! -f ".claude/agents/test-runner.md" ]; then
  echo "❌ FAIL: Agent config file missing"
  exit 1
fi
echo "✅ Agent config file exists"

# 2. Parse and compare configs
NODE_CONFIG=$(node -e "
  const fs = require('fs');
  const content = fs.readFileSync('.claude/agents/test-runner.md', 'utf8');
  const [, yaml] = content.match(/^---([\s\S]*?)---/);
  const config = require('js-yaml').load(yaml);
  console.log(JSON.stringify(config, null, 2));
")

echo "✅ Config parsed:"
echo "$NODE_CONFIG" | jq .

# 3. Verify tool set
TOOLS=$(echo "$NODE_CONFIG" | jq -r '.tools | join(",")')
if [[ $TOOLS == *"Bash"* ]] && [[ $TOOLS == *"Read"* ]]; then
  echo "✅ Tools match expected: $TOOLS"
else
  echo "❌ FAIL: Tools mismatch"
  exit 1
fi

# 4. Verify model
MODEL=$(echo "$NODE_CONFIG" | jq -r '.model')
if [ "$MODEL" = "haiku" ]; then
  echo "✅ Model is haiku"
else
  echo "⚠️ WARNING: Model is $MODEL (expected haiku)"
fi

# 5. Run test suite
echo
echo "Running parity tests..."
npm test test-parity.js

if [ $? -eq 0 ]; then
  echo
  echo "✅ ALL PARITY CHECKS PASSED"
  echo "CLI and Simulation context is synchronized"
else
  echo
  echo "❌ PARITY CHECK FAILED"
  exit 1
fi
```

Run with:
```bash
chmod +x verify-parity.sh
./verify-parity.sh
```

---

## Step 6: Version Control Integration

Track agent config changes:

```yaml
# .claude/agents/test-runner.md (with version markers)
---
name: test-runner
description: Run tests and report results concisely...
tools: Read, Bash, Glob, Grep
model: haiku
version: "1.0.0"              # Track version
lastModified: "2026-05-16"
---
```

Before running either CLI or simulation, verify version:

```javascript
const configVersion = parseAgentConfig('.claude/agents/test-runner.md').version;
const lastTestedVersion = loadLastTestedVersion();

if (configVersion !== lastTestedVersion) {
  console.warn(`⚠️ Config version changed: ${lastTestedVersion} → ${configVersion}`);
  console.warn('Re-running parity tests...');
  runParityTests();
}
```

---

## Complete Checklist for Parity

Before running tests via CLI or simulation:

```
CONTEXT PARITY VERIFICATION
============================

□ Agent config file exists and is readable
□ Agent config parses without errors
□ Name matches: test-runner
□ Tools match: [Read, Bash, Glob, Grep]
□ Model matches: haiku
□ System prompt is identical
□ Working directory is same
□ Environment variables are inherited
□ Context isolation is enforced (no main chat history)
□ File permissions are correct
□ No uncommitted changes to agent config
□ Config version hasn't changed since last test
□ Parity tests pass (CLI output == Simulation output)

Result: ✅ PARITY CONFIRMED
```

---

## How to Run Both Now

### Using the Same Config

```bash
# 1. Create config snapshot
node -e "
  const { parseAgentConfig } = require('./config-parser');
  const config = parseAgentConfig('.claude/agents/test-runner.md');
  console.log(JSON.stringify(config, null, 2));
" > .claude/snapshots/current-config.json

# 2. Verify config is valid
cat .claude/snapshots/current-config.json | jq .

# 3. Run via simulation (using same config)
node simulate-agent.js --config .claude/agents/test-runner.md

# 4. Run via actual CLI (would be)
# claude code . --run-agent test-runner

# 5. Compare outputs
diff <(npm test 2>&1) <(node simulate-agent.js --config .claude/agents/test-runner.md)
```

---

## Summary: Ensuring Parity

| Approach | Benefits | How |
|----------|----------|-----|
| **Config as Code** | Single source of truth | Parse `.md` file in both contexts |
| **Snapshots** | Track configuration state | Save config to JSON before running |
| **Parity Tests** | Verify output equivalence | Tests compare CLI vs simulation results |
| **Version Tracking** | Detect config changes | Add version field to agent config |
| **Verification Script** | Automated checks | Pre-flight checklist bash script |

**Key Principle:** Both the CLI and simulation should:
1. Read from the **same agent config file**
2. Parse it with the **same parser**
3. Run with the **same tool restrictions**
4. Return to the **same main conversation**

This ensures they're truly equivalent! ✅


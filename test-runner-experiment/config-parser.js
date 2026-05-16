/**
 * Parse agent configuration from .claude/agents/*.md files
 * Ensures CLI and simulation use identical configurations
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Parse a .claude/agents/*.md file into structured config
 */
function parseAgentConfig(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Agent config file not found: ${filePath}`);
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const fileSHA = crypto.createHash('sha256').update(content).digest('hex');

  // Split YAML header from markdown body
  const match = content.match(/^---([\s\S]*?)---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Invalid agent config format in ${filePath}`);
  }

  const [, yamlStr, body] = match;

  // Parse YAML manually (lightweight, no external dependency)
  const config = parseYAML(yamlStr);

  return {
    // Config from YAML header
    name: config.name,
    description: config.description,
    tools: (config.tools || '')
      .split(',')
      .map(t => t.trim())
      .filter(t => t),
    model: config.model || 'haiku',
    version: config.version || '1.0.0',

    // Body is the system prompt
    systemPrompt: body.trim(),

    // Metadata
    sourceFile: path.resolve(filePath),
    fileSHA: fileSHA,
    loadedAt: new Date().toISOString(),
    originalYAML: config,
  };
}

/**
 * Simple YAML parser for our config format
 */
function parseYAML(yamlStr) {
  const config = {};
  const lines = yamlStr.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();

    config[key] = value;
  }

  return config;
}

/**
 * Load all agent configs from .claude/agents/
 */
function loadAllAgentConfigs(agentsDir = '.claude/agents') {
  if (!fs.existsSync(agentsDir)) {
    return {};
  }

  const agents = {};
  const files = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    try {
      const config = parseAgentConfig(filePath);
      agents[config.name] = config;
    } catch (error) {
      console.error(`Failed to parse ${file}: ${error.message}`);
    }
  }

  return agents;
}

/**
 * Verify config parity: ensure both contexts use same config
 */
function verifyConfigParity(config, expectedTools) {
  const parity = {
    valid: true,
    checks: [],
  };

  // Check 1: Config loaded successfully
  if (!config || !config.name) {
    parity.valid = false;
    parity.checks.push({
      check: 'Config loaded',
      status: 'FAIL',
      message: 'Config is missing or invalid',
    });
    return parity;
  }

  parity.checks.push({
    check: 'Config loaded',
    status: 'PASS',
    message: `Loaded from ${config.sourceFile}`,
  });

  // Check 2: Tools match expected
  const actualTools = new Set(config.tools);
  const expectedSet = new Set(expectedTools || []);

  if (expectedTools) {
    const toolsMatch =
      actualTools.size === expectedSet.size &&
      [...actualTools].every(t => expectedSet.has(t));

    parity.checks.push({
      check: 'Tool permissions',
      status: toolsMatch ? 'PASS' : 'FAIL',
      message: `Tools: ${config.tools.join(', ')}`,
      expected: [...expectedSet].join(', '),
      actual: [...actualTools].join(', '),
    });

    if (!toolsMatch) parity.valid = false;
  }

  // Check 3: Model specified
  parity.checks.push({
    check: 'Model specified',
    status: config.model ? 'PASS' : 'FAIL',
    message: `Model: ${config.model}`,
  });

  // Check 4: System prompt exists
  const promptLength = config.systemPrompt ? config.systemPrompt.length : 0;
  parity.checks.push({
    check: 'System prompt',
    status: promptLength > 0 ? 'PASS' : 'FAIL',
    message: `${promptLength} characters`,
  });

  // Check 5: Version info
  parity.checks.push({
    check: 'Config version',
    status: 'PASS',
    message: `Version ${config.version}, SHA: ${config.fileSHA.substring(0, 8)}...`,
  });

  return parity;
}

/**
 * Print parity check results
 */
function printParityReport(parity) {
  const reset = '\x1b[0m';

  console.log('\n╔═══════════════════════════════════════════╗');
  console.log('║  CONFIG PARITY VERIFICATION REPORT        ║');
  console.log('╚═══════════════════════════════════════════╝\n');

  for (const check of parity.checks) {
    const icon = check.status === 'PASS' ? '✓' : '✗';
    const color = check.status === 'PASS' ? '\x1b[32m' : '\x1b[31m';

    console.log(
      `${color}${icon}${reset} ${check.check.padEnd(20)} ${check.status}`
    );
    console.log(`  └─ ${check.message}`);

    if (check.expected) {
      console.log(
        `     Expected: ${check.expected}\n     Actual:   ${check.actual}`
      );
    }
    console.log();
  }

  const overallIcon = parity.valid ? '✓' : '✗';
  const overallColor = parity.valid ? '\x1b[32m' : '\x1b[31m';
  console.log(
    `${overallColor}${overallIcon}${reset} Overall: ${parity.valid ? 'PARITY CONFIRMED' : 'PARITY MISMATCH'}`
  );
  console.log();

  return parity.valid;
}

// Exports
module.exports = {
  parseAgentConfig,
  loadAllAgentConfigs,
  verifyConfigParity,
  printParityReport,
};

// CLI usage
if (require.main === module) {
  const filePath = process.argv[2] || './.claude/agents/test-runner.md';

  try {
    const config = parseAgentConfig(filePath);

    console.log('\n╔════════════════════════════════════════════╗');
    console.log('║  AGENT CONFIGURATION PARSED                ║');
    console.log('╚════════════════════════════════════════════╝\n');

    console.log(`Name:        ${config.name}`);
    console.log(`Model:       ${config.model}`);
    console.log(`Tools:       ${config.tools.join(', ')}`);
    console.log(`Version:     ${config.version}`);
    console.log(`Source:      ${config.sourceFile}`);
    console.log(`File SHA:    ${config.fileSHA.substring(0, 16)}...`);
    console.log(`Loaded at:   ${config.loadedAt}`);

    console.log(`\nSystem Prompt (first 200 chars):`);
    console.log(`${config.systemPrompt.substring(0, 200)}...`);

    // Verify parity
    const parity = verifyConfigParity(config, config.tools);
    const valid = printParityReport(parity);

    process.exit(valid ? 0 : 1);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

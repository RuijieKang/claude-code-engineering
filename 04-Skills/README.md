# Skills Q&A

## Q1: Claude Code 中的 Skills 是什么？

### Claude Code 中 Skills 的定义

**Skills** 是 Claude Code 的"自动发现的能力包"——一种让 Claude **自动推理**何时使用何种专业能力的机制。

### 在 Claude Code 技术栈中的位置

```
Claude Code 技术栈
├── Plugins（顶层容器）
│   ├── Slash Commands（用户手动触发 /xxx）
│   ├── Skills（Claude 自动推理触发）  ← 这里
│   ├── MCP Servers（外部工具连接）
│   └── Hooks（事件驱动）
├── CLAUDE.md（记忆系统）
├── Sub-Agents（子代理）
└── Agent SDK（编程接口）
```

### Skills vs Commands 的核心区别

| 维度 | Commands | Skills |
|------|----------|--------|
| **触发方式** | 用户手动输入 `/command` | Claude **自动**推理判断 |
| **存放位置** | `.claude/commands/` | `skills/` 目录 |
| **主文件** | `*.md` | `SKILL.md`（固定名称） |
| **触发机制** | 精确匹配命令名 | LLM **语义推理**匹配 |

简单说：
- **Commands** = "你告诉 Claude 做什么"（显式触发）
- **Skills** = "Claude 知道什么时候该用什么能力"（隐式触发）

### Skills 的设计特点：渐进式披露

Skills 采用**按需加载**，节省 token：

1. **目录页**（~100 tokens）- 扫描所有 Skill 的 description
2. **章节**（<5k tokens）- 确定相关后，加载 SKILL.md
3. **附录**（按需）- 只有被引用的资源才加载

---

## Q2: 为什么其他 AI 工具和地方也在大谈特谈 Skills？

### "Skills" 是 AI Agent 领域的通用概念

**Skills 不是 Claude Code 独创的术语**，而是整个 AI Agent 生态系统中广泛使用的概念。不同平台对 Skills 的实现方式不同，但核心思想一致：

### 各平台/框架中的 Skills 概念对比

| 平台/框架 | Skills 的叫法 | 核心思想 |
|-----------|--------------|---------|
| **Claude Code** | Skills | 自动发现的能力包，LLM 推理触发 |
| **OpenAI GPTs** | Actions / Custom Instructions | 预定义的能力和行为模式 |
| **LangChain** | Tools / Toolkits | 可调用的功能模块 |
| **AutoGPT** | Skills / Abilities | Agent 可执行的原子操作 |
| **Microsoft Copilot** | Skills / Plugins | 扩展 Copilot 能力的模块 |
| **Semantic Kernel** | Skills / Plugins | 可组合的 AI 能力单元 |
| **CrewAI** | Tools | Agent 可使用的工具集 |

### 为什么 "Skills" 成为热门词汇？

#### 1. AI Agent 范式转变

```
传统 LLM 使用方式：
  用户 → Prompt → LLM → 回答

Agent 范式：
  用户 → Agent → [选择 Skill] → [执行] → [反馈] → 结果
                     ↑
              这就是 Skills 的作用
```

Agent 需要**模块化的能力**来完成复杂任务，Skills 就是这些能力的封装。

#### 2. 能力组合的需求

```
复杂任务 = Skill A + Skill B + Skill C

例如："帮我分析这个 PR 并部署到测试环境"
     = Code Review Skill + Security Check Skill + Deploy Skill
```

#### 3. 可扩展性要求

- **核心 Agent** 保持轻量
- **Skills** 作为插件按需加载
- 社区可以贡献新 Skills

### Claude Code Skills 的独特之处

相比其他平台，Claude Code 的 Skills 有几个独特设计：

| 特性 | Claude Code | 其他平台（通常） |
|------|-------------|-----------------|
| **触发方式** | LLM 语义推理 | 显式调用或关键词匹配 |
| **加载策略** | 渐进式披露 | 一次性加载 |
| **定义格式** | Markdown + YAML frontmatter | JSON/YAML/Code |
| **Token 优化** | 按需加载，节省 98% | 通常全量加载 |

### 行业趋势：从 Tools 到 Skills

```
2022: Tools（工具）
      └─ 简单的函数调用

2023: Toolkits（工具包）
      └─ 相关工具的集合

2024-2025: Skills（技能）
      └─ 带有上下文、知识、策略的完整能力包
      └─ 强调"知道什么时候用"而不只是"能做什么"
```

**Skills 比 Tools 更高级的地方：**
- Tools：我能调用这个 API
- Skills：我知道什么时候该调用这个 API，怎么解读结果，失败了怎么处理

### 总结

| 问题 | 答案 |
|------|------|
| Skills 是 Claude Code 独有的吗？ | 不是，是 AI Agent 领域的通用概念 |
| 为什么都在谈 Skills？ | 因为 Agent 需要模块化、可组合的能力 |
| Claude Code 的 Skills 有什么特别？ | 渐进式披露、LLM 语义推理触发、Markdown 定义 |
| Skills 和 Tools 什么区别？ | Skills = Tools + 知识 + 策略 + 上下文 |

---

## Q3: Skills 和 Tools 有何区别？

在 Claude Code 语境下，**Tools** 和 **Skills** 是两个不同层次的概念：

### 对比总览

| 维度 | Tools | Skills |
|------|-------|--------|
| **是什么** | Claude 可调用的原子操作 | 带知识和策略的完整能力包 |
| **来源** | 系统内置 / MCP 提供 | 开发者用 Markdown 定义 |
| **粒度** | 单个操作（读文件、执行命令） | 一套工作流（审查代码、生成 API） |
| **智能程度** | 被动调用，无自主判断 | 包含何时使用、如何使用的策略 |
| **定义方式** | 代码 / JSON Schema | SKILL.md + YAML frontmatter |

### 具体区分

**Tools** 是 Claude 的"手"——执行具体动作：

```
Read        → 读取文件
Edit        → 编辑文件
Bash        → 执行命令
Grep        → 搜索内容
MCP Tools   → 调用外部 API
```

**Skills** 是 Claude 的"技能"——知道在什么场景下、用哪些 Tools、按什么策略完成任务：

```
财务分析 Skill → 知道何时触发，调用哪些 Tools，按什么流程分析，输出什么格式
API 生成 Skill → 知道读取哪些模板，调用哪些命令，遵循什么规范生成代码
```

### 一句话总结

> **Tools 是能力，Skills 是运用能力的智慧。**
>
> Tools 回答"能做什么"，Skills 回答"什么时候做、怎么做、做完怎么判断"。

---

## Jack's notes on the Skills Spec ([agentskills.io/specification](https://agentskills.io/specification))

### What the spec covers

The Agent Skills spec is a vendor-neutral standard for packaging AI agent capabilities. Key elements:

- **Directory layout**: `skill-name/SKILL.md` is the minimum viable skill; `scripts/`, `references/`, `assets/` are optional conventions.
- **SKILL.md frontmatter**: `name` and `description` are the only required fields. Optional fields: `license`, `compatibility`, `metadata`, `allowed-tools` (experimental).
- **Naming rules**: lowercase alphanumeric + hyphens only, no leading/trailing/consecutive hyphens, max 64 chars, must match the parent directory name.
- **Description quality matters**: the description is used by the LLM to decide whether to activate a skill, so keyword density and clarity directly affect recall.

### Progressive disclosure — the key design insight

The spec formalizes a three-tier loading strategy:

| Tier | What loads | Approx. size |
|------|-----------|-------------|
| Metadata | `name` + `description` only | ~100 tokens per skill |
| Instructions | Full `SKILL.md` body | < 5 000 tokens recommended |
| Resources | Files in `scripts/`, `references/`, `assets/` | On-demand only |

This is exactly the "pay-per-use" model Claude Code already uses internally. Writing skills against this spec naturally keeps startup cost flat regardless of how many skills are installed.

### Observations & design implications

1. **`allowed-tools` is experimental but powerful.** Pre-approving tools at the skill level (`Bash(git:*) Read`) removes per-call permission prompts. Worth watching — could become the standard way to ship opinionated permission bundles.

2. **`compatibility` is underspecified but useful.** There's no machine-parseable format; it's a free-text hint. A skill that requires `docker` or `Python 3.14+` should declare it here so agents can fail fast before attempting work.

3. **Directory name = `name` field.** The spec enforces that the directory name matches the `name` frontmatter. This is a sharp constraint if you rename a skill — the directory must move too.

4. **No versioning in the core spec.** Version lives under `metadata.version` as a convention, not a first-class field. Dependency management between skills is out of scope.

5. **File reference depth.** The spec recommends keeping references one level deep from `SKILL.md` to avoid nested chains that are hard to reason about.

### Relationship to Claude Code's own Skills implementation

Claude Code follows this spec closely. The main additions on top of the spec are:

- The `TRIGGER` / `SKIP` heuristics in skill descriptions (Claude Code–specific syntax for guiding LLM activation).
- The `Skill` tool that invokes skills programmatically from within the agent session.
- The global vs. project skill discovery paths (`.claude/skills/` vs user-level directories).

# Claude Code 记忆系统

Claude Code 的记忆系统让 Claude "记住"关于你的项目、团队规范和个人偏好的重要信息。每次启动 Claude Code 时，这些记忆会自动加载到上下文中。

**核心文件：CLAUDE.md**

CLAUDE.md 是一个特殊文件，Claude 在开始对话时会自动将其内容拉入上下文。它就像是给 Claude 的"项目入职文档"。

Claude Code 提供四个层级的记忆，按优先级从高到低：

```
┌─────────────────────────────────┐
│     ~/.claude/CLAUDE.md         │  ← 用户级（全局）
├─────────────────────────────────┤
│     ./CLAUDE.md                 │  ← 项目级（团队共享）
├─────────────────────────────────┤
│     ./CLAUDE.local.md           │  ← 项目本地（个人）
├─────────────────────────────────┤
│     ./.claude/rules/*.md        │  ← 规则目录（分类规则）
└─────────────────────────────────┘
```

## 总结

Claude Code 记忆系统是提高效率的关键：

1. **层级结构**
   - 用户级：个人偏好
   - 项目级：团队规范
   - 本地级：个人笔记
   - 规则目录：分类规则

2. **编写原则**
   - 保持精简
   - 具体明确
   - 回答 WHY/WHAT/HOW
   - 使用渐进式披露

3. **最佳实践**
   - 项目级记忆提交到 git
   - 本地级记忆加入 .gitignore
   - 定期审查和优化
   - 使用条件规则按需加载

**记住：** CLAUDE.md 是给 Claude 的入职文档，让它快速理解你的项目 DNA。

---

## Jack's Notes: Managing Memory Directly with Claude Code

You don't need to manually edit CLAUDE.md files — Claude Code can manage its own memory through conversation.

### Saving memories

Just tell Claude what to remember:

```
Remember that we use pnpm, not npm, in this project.
Remember my name is Jack and I prefer concise responses.
```

Claude will write the information into the appropriate CLAUDE.md file automatically.

### Reading and reviewing memories

Ask Claude to surface what it knows:

```
What do you remember about this project?
Show me what's in CLAUDE.md.
```

Claude will read and summarize the current memory files.

### Updating and forgetting

```
Forget the rule about using tabs — we switched to spaces.
Update your memory: the API base URL is now https://api.example.com/v2
```

Claude will locate the relevant entry and edit or remove it.

### Choosing the right level

Tell Claude which layer to target:

```
Add this to the global CLAUDE.md, not the project one.
Save this only in CLAUDE.local.md — it's personal, not for the team.
```

### Tips

- **Team rules** → commit `CLAUDE.md` to git so everyone benefits.
- **Personal preferences** → use `CLAUDE.local.md` and add it to `.gitignore`.
- **Audit anytime**: `cat CLAUDE.md` or ask Claude to read it.
- Keep entries short and specific — Claude loads the whole file on every session.

---
name: Curriculum-Path-Enforcer
description: Enforce correct curriculum pathing and initialization.
---

When planning or creating structure:

- Always read curriculum/index.md first to determine the active curriculum and target language.
- Enforce path schema: curriculum/{source}-to-{target}/modules/NN-Name/
- Never create language folders at the repo root (e.g., do not create ./korean/).
- Create module directories with two-digit prefixes (01, 02, ...).
- Each module requires a README.md with goals, lesson list, and prerequisites.
- Record Curriculum and Module entities in MCP memory; relate Module → Curriculum.
- Before handing off to Content Creator, run a non-fatal precheck: dotnet run validate-bilingual <module-dir>.


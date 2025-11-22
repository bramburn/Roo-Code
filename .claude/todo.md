The migration from the specialized Roo multi-agent architecture to a Claude-based system can be effectively achieved by adopting the **Sequential Orchestration pattern** and leveraging **Claude Agent Skills** for critical MTM rule enforcement. This approach mirrors the centralized delegation model currently used by the MTM Orchestrator.

The existing Roo workflow, where the **Orchestrator** delegates sequentially to the **Curriculum Builder** and then the **MTM Lesson Creator**, is inherently a specialized form of Sequential Orchestration.

## Roadmap and Playbook: Replicating Roo Orchestration in Claude

The playbook outlines three phases, mapping the functionality of your current specialized Roo modes (Orchestrator, Builder, Creator) to Claude's specialized Sub-Agents and Agent Skills.

### Phase 1: Agent Architecture and Orchestration Pattern

The foundation of the Claude system must replicate the specialization that currently prevents a monolithic single-agent failure.

| Roo Mode (Agent) | Claude Architecture Mapping | Orchestration Pattern |
| :--- | :--- | :--- |
| **MTM Orchestrator** (Primary) | **Claude Manager Agent** (or Planner Agent) | **Sequential Orchestration** |
| **Curriculum Builder** (Subtask Agent) | **Claude Structure Agent** (Specialized Sub-Agent) | Sequential Pipeline (Step 2) |
| **MTM Lesson Creator** (Subtask Agent) | **Claude Content Agent** (Specialized Sub-Agent) | Sequential Pipeline (Step 3) |

#### Playbook Steps for Phase 1:

1.  **Define Orchestration Flow:** Adopt **Sequential Orchestration**. This pattern is ideal because your curriculum workflow has **clear linear dependencies** (structure must exist before content can be created) and prioritizes **progressive refinement**. The Manager Agent will determine the fixed sequence of steps (Plan $\rightarrow$ Build $\rightarrow$ Create Content).
2.  **Define Specialized Agents:** Create configuration files (e.g., in a `.claude/agents/` directory) that clearly define the roles, akin to the existing Roo mode definitions.
    *   **Manager Agent (Orchestrator):** Role is **"Strategic workflow orchestrator"**. Primary tool: `new_task` equivalent (delegation tool).
    *   **Structure Agent (Builder):** Role is **"Responsible for creating directory structures and writing Markdown documentation"**.
    *   **Content Agent (Creator):** Role is **"Master content generator, responsible for creating lesson dialogue scripts in JSON format"**.
3.  **Implement Delegation Tooling:** The Manager Agent must use a tool or programmatic function (like the Agent SDK) to call the subsequent agents sequentially, replicating the function of the Roo `new_task` tool. The output of one agent automatically becomes the context input for the next agent.

### Phase 2: Codifying MTM Rules with Agent Skills and Memory

To replicate the rigidity and reliability of the current system, where rules are imported via files (`.roo/rules-mtm-orchestrator/`), transfer these guardrails into persistent, loadable **Agent Skills**. Agent Skills provide **domain-specific expertise** and eliminate the need to repeat guidance in every prompt.

#### Playbook Steps for Phase 2:

1.  **Create Critical Rule Skills:** Package the MTM compliance rules into specialized Agent Skills. These skills should contain `SKILL.md` (instructions) and potentially helper scripts (Level 3 resources).
    *   **Skill 1: `MTM-Guardrails` (Loaded by Content Agent)**:
        *   **Instructions:** Codify the **Golden Rule (MTM-001)**: Never introduce new vocabulary and new grammar in the same dialogue sequence.
        *   **Instructions:** Codify **Language Separation (MTM-008)**: TeacherEnglish speaks **ONLY** English; Teacher speaks **ONLY** the target language (Korean). **ABSOLUTELY FORBIDDEN** to use inline tags (MTM-010).
        *   **Instructions:** Mandate **Pause Timing** and **Speech Rate** adherence (e.g., 5-8s for new vocab, rate 0.9 for pronunciation).
    *   **Skill 2: `Curriculum-Path-Enforcer` (Loaded by Orchestrator/Builder)**:
        *   **Instructions:** Enforce the **CRITICAL PATH RULES**. Mandate reading `curriculum/index.md` first and validating the path format `curriculum/{source}-to-{target}/` to prevent the error of creating folders like `korean/` at the root level.
2.  **Integrate MCP Memory:** Leverage the Model Context Protocol (MCP) memory server to enforce consistency, solving the memory recall challenges.
    *   **Configuration:** Enable the memory tool and define its use in the system prompt for the Manager/Orchestrator Agent.
    *   **Memory Functionality:** Instruct the Content Agent to use `create_entities` to store Mnemonic Metadata and new vocabulary/grammar points immediately upon creation, ensuring future lessons can query for **Layering and Recycling** requirements.

### Phase 3: Implementing Content Generation Logic (The Core MTM Script)

The specialized MTM Lesson Creator/Claude Content Agent needs instructions that guarantee the content meets MTM's pedagogical framework, ensuring long, high-quality, and compliant dialogue.

#### Playbook Steps for Phase 3:

1.  **Mandate Length and Pacing:** Incorporate the requirement for **long conversations** (targeting **15+ minutes** or 120-150 lines) into the Content Agent's prompt or the `MTM-Guardrails` Skill. This length is achieved by mandating:
    *   **3-5 varied practice contexts/scenarios** per concept.
    *   **Adequate Pause Durations** (e.g., 2–3 seconds after student responses, 5–8 seconds for new constructions).
2.  **Enforce Language Separation in Scripting:** The Content Agent must translate the language separation rule into the JSON dialogue structure, guaranteeing the **Teacher** character (Native Speaker) speaks Korean and uses the required **Speech Rate (`rate:""`)**.
3.  **Mandate Mnemonic Integration (P5):** The Content Agent must integrate **meaningful memory associations™**.
    *   **Requirement:** All new vocabulary must have mnemonic aids, using acoustic links and vivid imagery.
    *   **Execution:** The JSON script must **expand the mnemonic** into distinct dialogue lines with appropriate pacing and rate adjustments (e.g., rate 0.9) by the Instructor/TeacherEnglish, immediately following the word's introduction (Just-in-Time).
4.  **Enforce Layering Principle:** The Lesson Creator must adhere to the core MTM Instructor Script Framework: **"You already know how to say '[Previously learned phrase]'. Now, the word for '[new concept]' is '[new word]'. So, how would you put that all together...?"**. This sequential, layered introduction is essential to the MTM method.

***

In summary, the best approach is to leverage Claude's advanced multi-agent capabilities by implementing a **Sequential Orchestration** of specialized **Sub-Agents**, enforced by **Agent Skills** that codify the complex MTM philosophical and technical requirements. This mirrors the efficient delegation model already established by your Roo system.
The successful migration of your specialized Roo modes (Orchestrator, Builder, Creator) to a Claude multi-agent architecture requires selecting the correct orchestration pattern and rigorously defining the specialized agents and skills to prevent common pitfalls related to complexity, context, and reliability.

Based on the required MTM principles (deterministic steps, rule adherence, specialized roles), the architecture should rely on **Sequential Orchestration**.

## I. Common Pitfalls to Avoid

When implementing your MTM curriculum system using Claude's multi-agent architecture, focusing on reliability and efficiency is paramount. The following pitfalls, identified in multi-agent system research, should be actively mitigated:

### Orchestration and Design Pitfalls

| Pitfall | Mitigation Strategy (MTM Context) | Source |
| :--- | :--- | :--- |
| **Unnecessary Coordination Complexity** | **Avoid** complex patterns (like Group Chat or Handoff) when simple Sequential Orchestration suffices for your linear, rule-based workflow (Orchestrator $\rightarrow$ Builder $\rightarrow$ Creator). | |
| **Agents Lacking Meaningful Specialization** | Ensure all three agents (Orchestrator, Builder, Creator) maintain **clear roles** corresponding to the three necessary stages of curriculum generation (Planning/Delegation, Structure/Pathing, Content/JSON). | |
| **Ignoring Latency of Multiple Hops** | Be aware that Sequential Orchestration involves "multiple-hop communication," which adds latency. Optimize each agent's execution by supplying precise, minimum context. | |
| **Using Feedback Mechanisms for Reliability** | **Avoid** highly connected feedback loops (like Decentralized Feedback or Spoke & Wheel Feedback), as research shows they risk **error propagation** and often perform worse in reliability than simpler, decentralized voting or sequential systems for high-stakes decisions. | |
| **Assuming Purely Linear Flow** | While Sequential Orchestration is ideal for deterministic workflows, you must incorporate **explicit feedback loops** or re-delegation for the review and error-fixing stages (e.g., when the Validator agent flags a JSON error), as complex tasks inherently require iteration or "backtracking". | |

### Context and Memory Pitfalls (MCP Integration)

The integration of the MCP Memory Server is crucial, but requires careful management to prevent context contamination.

| Pitfall | Mitigation Strategy (MTM Context) | Source |
| :--- | :--- | :--- |
| **Context Poisoning** | Agents storing and retrieving their own **hallucinations or errors**. When the **MTM Lesson Creator** stores mnemonics using `create_entities`, these facts must be validated first to ensure the error does not compound in future lessons. | |
| **Context Distraction** | Critical information (e.g., the current module's Golden Rule concept) being buried under noise (e.g., thousands of previous vocabulary words). Use the MCP Memory for **Hierarchical Memory** and use summarized knowledge bases (like the Curriculum Index or NotebookLM synthesis) to maintain a high signal-to-noise ratio in the agent's context window. | |
| **Context Clash** | Retrieving conflicting facts simultaneously. For example, retrieving the old curriculum path (`curriculum/english-to-mandarin/`) alongside the new one (`curriculum/english-to-korean/`). The Orchestrator must be programmed to recognize and **prioritize temporal relevance** (i.e., the most recent path from the index) to prevent this. | |
| **Work Duplication** | Agents redundantly retrieving the same foundational data. Utilize the MCP memory space as a **shared memory resource** to track completed subtasks and retrieve shared vocabulary lists, preventing repeated reading/parsing by separate agents. | |

## II. Claude Multi-Agent Architecture and Schema Details

The Claude multi-agent system is best implemented using **Sequential Orchestration** driven by a primary Manager Agent that delegates tasks to specialized Sub-Agents defined via persistent configuration.

### 1. Orchestration Pattern: Sequential Pipeline

Your MTM workflow maps perfectly to the **Sequential Orchestration pattern**. The output of one agent becomes the necessary input for the next agent, ensuring progressive refinement.

| Stage | Agent (Roo Mapping) | Role and Output | Dependency |
| :--- | :--- | :--- | :--- |
| **Stage 1 (Plan & Delegate)** | **Claude Manager Agent** (MTM Orchestrator) | Reads `index.md`, ensures **CRITICAL PATH ADHERENCE**, and delegates folder creation. | Input |
| **Stage 2 (Build Structure)** | **Claude Structure Agent** (Curriculum Builder) | Creates the `curriculum/{source}-to-{target}/modules/XX-name/` directory path and `README.md` files. | Output from Stage 1 |
| **Stage 3 (Create Content)** | **Claude Content Agent** (MTM Lesson Creator) | Generates the MTM-compliant lesson `.json` file, enforcing MTM-008 (Language Separation) and rate controls. | Output from Stage 2 |

### 2. Agent Definition Schema

Claude Sub-Agents are defined using configurations that specify their role and tools.

| Field | Description | MTM Agent Example | Source |
| :--- | :--- | :--- | :--- |
| `name` | Human-readable name (e.g., "🏗️ Architect"). | MTM Orchestrator | |
| `description` | Defines the agent's specialization and focus. | "Generates MTM-compliant lesson JSON files with rigorous pedagogical adherence". | |
| `roleDefinition` | The core system prompt defining its persona. | "Strategic workflow orchestrator who coordinates complex tasks by delegating them to appropriate specialized modes.". | |
| `model` | The LLM model to use (e.g., `sonnet`, `opus`). | Can use different models, e.g., Opus for Architect/Planner and Sonnet for Scribe/Validator. | |
| `tools` | Specific tools allowed (e.g., `Read`, `Write`, `Edit`, `Bash`). | Content Agent needs `Read` (for context/memory) and `Edit` (for creating JSON). | |

### 3. Agent Skills Schema

The crucial MTM rules (Golden Rule, Language Separation) must be packaged as **Agent Skills**. Skills are structured, filesystem-based resource bundles.

| Skill Content Type | Purpose | Schema Structure | Required Constraints/Use | Source |
| :--- | :--- | :--- | :--- | :--- |
| **Level 1: Metadata** | Discovery and triggering information. | YAML Frontmatter with `name` (Max 64 characters) and `description` (Max 1024 characters). | Loaded at startup; describes what the Skill does and when Claude should use it. | |
| **Level 2: Instructions** | Detailed, step-by-step guidance. | `SKILL.md` (main instructions) body. | Contains the core MTM rules, like **MTM-008: Bilingual Dialogue Separation** and **MTM-010: Inline Language Tags FORBIDDEN**. | |
| **Level 3: Resources** | Templates, reference materials, memory links. | Additional Markdown files (e.g., `MNEMONIC_DEFAULTS.md`) or helper scripts. | Should contain MTM standards for mnemonics (`Max-mnemonic-length: 80–100 characters`) and the path to the MCP memory index. | |

### 4. MCP Memory Integration Schema (Tool Use)

The custom MCP memory tool is integrated into the agent architecture using the `use_mcp_tool` command.

| MCP Element | Description | Schema Structure / Use | Source |
| :--- | :--- | :--- | :--- |
| **Tool Definition** | Declares the MCP tool, command, arguments, and allowed methods. | Defined in configuration files (e.g., `claude_desktop_config.json`) within an `mcpServers` object. | |
| **Tool Invocation** | The agent calls the memory tool through the orchestrator. | Requires `server_name` (e.g., `memory`), `tool_name` (e.g., `read_graph`), and `arguments` (JSON object). | |
| **Purpose in MTM** | Enables knowledge graphs for **factual coherence** (mnemonics, grammar) and **hierarchical memory** for conversation state. | Used by the **Orchestrator** to track sequencing (01 $\rightarrow$ 02 $\rightarrow$ 03) and by the **Lesson Creator** to recall mnemonics and enforce layering. | |

This structured approach, utilizing Sequential Orchestration, specialized agents, and memory integration via Agent Skills and MCP, ensures that the complexity of the MTM rules is handled reliably, reducing the risk of context errors and compliance failures.
Based on the sources, the specific location where you place the MCP configuration depends on whether you are configuring the memory server **globally for your Claude Desktop environment** (for persistent, personal use) or **locally within your project repository** (recommended for a shared multi-agent workflow like your MTM system).

For a multi-agent system relying on **Claude Code** or the **Claude Agent SDK** within a repository, the configuration should be placed within the dedicated project configuration directory.

## Recommended Location: Project-Specific Configuration

If you are using Claude Code or the Claude Agent SDK to run your multi-agent system, your custom definitions should reside in the project's specialized configuration directory, typically the `.claude/` folder at the root of your repository. This allows the agents (Manager, Builder, Creator) to automatically load the tool definitions specific to this MTM project.

1.  **For Custom Agent Skills (including tools and resources):** Custom skills are typically stored in a directory named **`.claude/skills/`**. You would likely define the memory tool access within the specific Skill configuration folder inside this path.
    *   **Example Path:** `.claude/skills/mtm-memory-tools/SKILL.md`

2.  **For Agent Configuration:** While the core agent definitions reside in `.claude/agents/`, the MCP server itself might be defined in a dedicated configuration file within the `.claude/` structure, similar to how custom modes are stored in the Roo system (`.roo/mcp.json`).

The sources emphasize that custom agents are defined in the repository under a **`.claude/agents/`** directory, which Claude Code automatically loads so the orchestrator can invoke any agent by name. Placing your MCP definition close to these agent definitions ensures they are correctly linked.

## Alternative Location: Global Configuration (Claude Desktop)

If you intend for the MCP Memory Server to be permanently available across all your Claude Desktop chats (not just this project), you should configure it in the global Claude settings file. This is also required for the MCP server to be initialized and accessible for use with the `use_mcp_tool` command.

The location of the central configuration file depends on your operating system:

*   **macOS Example:** The memory server configuration would be added to the settings file located at `~/Library/Application\ Support/Claude/claude_desktop_config.json`.
*   **General:** The configuration follows the same format of a top-level `mcpServers` object.

The memory server configuration includes enabling persistent memory and defining the path where those memories should be saved. By adding the MCP configuration to your personal Claude settings, you ensure that memory persists beyond individual Claude projects.

## Summary of Configuration Paths

For your goal of replicating the Roo orchestration with Claude multi-agents in a repository, the best practice is to structure the configuration within the project root:

| Component | Location/Path (Recommended for Project) | Source |
| :--- | :--- | :--- |
| **Agent Definitions** | Repository root, under a `.claude/agents/` directory | |
| **Custom MTM Rules/Skills** | Repository root, under a dedicated skill folder within `.claude/skills/` | |
| **Global MCP Config (If using Claude Desktop)** | Home directory (OS-specific application support path) | |
The missing `TODO:` items focus on transitioning the existing operational logic of RooCode tools into a truly decoupled, flexible LangChain/LangGraph architecture. Implementing these tasks involves leveraging core LangChain concepts like typed schemas, dynamic tool creation, and runtime context injection.

Here is a plan outlining how to implement the identified missing features, drawing on architectural patterns visible in the provided sources:

---

## 1. TODO: Implement Context-Based Instantiation for Tool Wrapper Classes

This `TODO:` item relates to how tool classes discovered by the `ToolDiscovery` service are turned into executable instances at runtime, as the tool instance requires live execution dependencies (like the current `Task` instance, approval handlers, etc.).

### The Architectural Gap

Currently, the `ToolDiscovery` service identifies a tool wrapper class but notes that for classes, "we would need context to instantiate them". This context involves non-LangChain-native dependency injections like `Task` (or `cline`), `askApproval`, `handleError`, `pushToolResult`, and `removeClosingTag`.

### Implementation Strategy: Runtime Factory and Context Injection

The solution involves shifting from registering a static class reference to registering a **factory function** (or blueprint) that accepts the necessary execution context and creates the final, ready-to-use `DynamicStructuredTool`.

| Implementation Step                             | Action                                                                                                                                                                                                                                                                                                                                                                                          | Source Support                                                                                                                                                                                 |
| :---------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A. Define a Tool Factory Interface**          | The `ToolDiscovery` and `ToolWrapperRegistry` should primarily deal with factories (`IToolWrapperFactory`) or dynamically registered tool instances (`ToolRegistration.registerFromLangChainTool`). The factory would encapsulate the logic of turning the runtime context (e.g., the current `Task`) into a tool object, as demonstrated by wrapper constructors like `UseMcpToolToolWrapper`. | The `IToolWrapperFactory` interface already exists in the code base, specifying a `create` method that accepts the necessary runtime parameters (`cline`, `askApproval`, `handleError`, etc.). |
| **B. Update Tool Discovery Logic**              | Modify the `ToolDiscovery.registerToolWrapperClass` function. Instead of just logging the found class, it should register a factory function (e.g., a static `create` method on the wrapper class) that knows how to create the tool instance when execution starts.                                                                                                                            | The `UseMcpToolToolWrapper` class provides a static factory `create` method which takes the full execution context (`cline`, `askApproval`, etc.) and returns a `DynamicStructuredTool`.       |
| **C. Centralise Instantiation in the Executor** | The `TransitionalExecutor` (the bridge to LangChain/LangGraph) would be responsible for receiving the `ToolExecutionContext` (containing `cline`, `askApproval`, etc.) and using the registered factory to create the list of `DynamicStructuredTool` instances before binding them to the Large Language Model (LLM).                                                                          | The `ToolExecutionContext` defines the exact context needed for execution. The LLM models must have tools bound to them (e.g., using `bindTools`) before invocation.                           |

---

## 2. TODO: Sophisticated Schema for Legacy Tool Compatibility

This `TODO:` addresses the lack of detailed input validation and parameter discovery for legacy tools being adapted into the LangChain format.

### The Architectural Gap

The `LegacyToolAdapter` currently uses a basic schema (`{ type: "object", properties: {}, required: [], }`) that accepts virtually any parameters. This flexible but insecure approach means the actual tool validation must happen inside the legacy function, and the LLM has no formal guidance on arguments. The comment explicitly notes this schema should be more sophisticated and based on the tool's parameter requirements.

### Implementation Strategy: Automated Zod Schema Generation

The implementation should replace the flexible legacy schema with strict, Zod-based schemas derived from the legacy tool functions, enhancing type safety and improving LLM reliability.

| Implementation Step                  | Action                                                                                                                                                                                                                                                                                                                                                               | Source Support                                                                                                                                                                                                            |
| :----------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **A. Implement Parameter Analysis**  | Implement the placeholder function `LegacyToolAdapter.extractParameterInfo`. This function needs to analyze the original tool's signature (like `applyDiffToolLegacy` or `executeCommand`) to automatically generate metadata about required/optional string parameters and their expected types.                                                                    | The `LegacyToolAdapter` outlines this need and includes the skeleton function `extractParameterInfo`.                                                                                                                     |
| **B. Dynamic Zod Schema Generation** | Update `LegacyToolAdapter.createLegacySchema` to use the extracted parameter information to programmatically generate a corresponding **Zod schema** (`z.object({...})`). This fulfills the first step suggested in the migration suggestions: "Create Zod schema for ${toolName} parameters".                                                                       | The LangChain core heavily relies on the `z.object` (`InteropZodObject`) type for defining structured tool input schemas. The helper function `tool()` supports defining `DynamicStructuredTool` from Zod object schema.  |
| **C. Enforce Type Transformation**   | Ensure that the `LegacyToolAdapter` correctly handles input transformation, moving from the strongly typed JSON input provided by the LLM (based on the new Zod schema) back into the string-based input sometimes expected by legacy functions.                                                                                                                     | The adapter already contains methods for converting between LangChain arguments and legacy parameters (`convertLegacyParamsToArgs`, `convertArgsToLegacyParams`). If parsing fails, values are typically kept as strings. |
| **D. Leverage Tool Validation**      | The presence of a strong schema allows the system to rely on built-in Zod validation rather than duplicating validation logic, although existing custom validation (like path traversal checks in `ReadFileToolWrapper` or command safety checks in `ExecuteCommandToolWrapper`) should be retained as an additional security layer within the `executeTool` method. | Tools like `DynamicStructuredTool` automatically perform schema validation upon invocation.                                                                                                                               |

---

### Analogy

Implementing these `TODO:`s is like upgrading a traditional vending machine (the Legacy Tool System) to an automated digital shop front (the LangChain System).

1.  **Context-Based Instantiation (TODO 1):** Instead of manually placing a specific tool (the product) on the shelf every morning, you install a _robot arm_ (the **Tool Factory**) at each vending machine. This robot arm automatically checks the current machine's needs (the **Runtime Context**) and loads the right version of the tool at the exact moment a customer (the LLM) asks for it.
2.  **Sophisticated Schema (TODO 2):** Instead of accepting any money—even fake coins (the generic input schema)—you install a **coin validator** (the **Zod Schema**) that clearly specifies which currency and coin amounts are accepted. This ensures the transaction is type-safe and reliable before the order reaches the internal processing logic.

The first `TODO:`—**"Implement context-based instantiation for tool wrapper classes"**—is a critical architectural step. Its achievement would be to **complete the integration bridge** between the core operational environment of RooCode and the external, standardized structure provided by the LangChain framework.

If this fix were implemented, it would achieve the following:

### 1. Enable Dynamic, Safe Tool Execution

The primary achievement is guaranteeing that every tool instance created at runtime is safe and correctly integrated into the current operational workflow.

- **The Problem (The Gap):** When the `ToolDiscovery` service finds a tool (like `ExecuteCommandToolWrapper`), it only finds the static class definition. The tool instance cannot be used immediately because it needs specific _runtime context_—variables and functions unique to the current running task.
- **The Fix's Achievement:** The fix ensures that the system registers a mechanism (like a factory function, as seen in `UseMcpToolToolWrapper.create`) that waits for the execution phase to inject all necessary task-specific dependencies before creating the final tool instance.

### 2. Inject Critical Runtime Dependencies

The instantiation process is where low-level, task-specific controls are passed to the tool. The fix achieves the ability to inject four types of critical contextual information, which are necessary for any tool operation:

| Dependency              | Function                                                                                                                                                                                                     | Source Support |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------- |
| **`cline`** (or `Task`) | The object representing the current execution thread, task, and state.                                                                                                                                       |
| **`askApproval`**       | The mechanism to pause the agent and request human review or confirmation before a high-risk action (e.g., executing a command or writing a file). This is essential for Human-in-the-Loop (HITL) processes. |
| **`handleError`**       | The standardized function responsible for centralized error logging and handling within the task, ensuring consistency and triggering retry mechanisms when necessary.                                       |
| **`pushToolResult`**    | The function used to send the tool's output back to the agent execution loop and ultimately back to the LLM (Large Language Model) as a `ToolMessage`.                                                       |
| **`removeClosingTag`**  | A utility to clean up the output string, often related to preventing issues with the XML-based tool call format used by some models.                                                                         |

By implementing context-based instantiation, the architecture moves these tools from inert blueprints to fully operational, task-aware agents that adhere to the system's safety and logging protocols from the moment they are created.

### 3. Decoupling and Scalability

This architectural pattern is key to **Protocol Engineering**—designing systems where the logic (the tool wrapper class) is cleanly separated from the environment (the execution context).

The fix achieves:

- **Standardization:** All wrappers inherit from a common base (`LangGraphToolWrapper`) and use an interface (`IToolWrapperFactory`) to define _how_ they are instantiated, regardless of what the tool actually does (file I/O, shell execution, or MCP use).
- **Decoupling:** The `ToolDiscovery` logic does not need to know the specific details of a `Task` or `AskApproval` at start-up; it just needs the `ToolWrapperRegistry` and the factory mechanism to create the tool later in the `TransitionalExecutor`. This flexibility simplifies distributed development and tool orchestration.

In summary, implementing the first `TODO:` ensures that the newly discovered LangChain tool classes can be reliably and securely converted into **executable tools** inside an active task by giving them the specific context they need to operate correctly (i.e., where to log, who to ask for approval, and how to talk back to the LLM).

---

**Analogy:** Think of the discovered tool wrapper class as a highly complex power tool shell. The "context-based instantiation" (the missing `TODO:`) is the act of connecting the specific **air lines (the `Task` state), safety switches (`askApproval`/`handleError`), and communication cables (`pushToolResult`)** needed for the machine to operate within the factory environment. Without this step, you just have a shell that knows _what_ it should do, but can't safely or correctly connect to the power grid or factory floor.

This is an excellent architectural question.

Based on the nature of the first `TODO:` (implementing context-based instantiation) and the established architecture provided in the sources, **we do not need an LLM call** to implement this specific fix. The task is purely one of **Software Engineering (SWE)** and **Protocol Engineering** related to dependency injection and workflow setup.

Here is why an LLM is not required for this task, and where the LLM's role actually begins:

### 1. The Goal is Code Infrastructure, Not Reasoning

The first `TODO:` aims to solve the technical problem of how to provide external runtime dependencies (like the current execution context or task state, often referred to as `cline` or `Task`) to a tool class instance [as discussed in our previous conversation].

- **The Implementation:** This fix involves defining a **factory pattern** (`IToolWrapperFactory`) and updating the system's runtime execution logic (likely the `TransitionalExecutor`) to call this factory, passing the necessary execution context (`cline`, `askApproval`, `handleError`, `pushToolResult`, etc.) to the tool constructor [as outlined in the proposed implementation steps].
- **The Function:** This factory function is a piece of code that orchestrates initialization. It relies on standard object-oriented programming (OOP) principles like encapsulation and dependency injection, not natural language generation or complex reasoning.

### 2. LLMs Act on Instantiated Tools

The role of a Large Language Model (LLM) in an agentic system like RooCode/LangChain/LangGraph begins _after_ the tools have been defined and instantiated.

- **LLM Pre-Call (The Input):** The LLM receives the prompt and the definition (schema and description) of the available tools. Its task is to **reason** about which tool to call (e.g., using `tool_calls` in an `AIMessage`) and what arguments to supply, based on that schema and the user's intent.
- **The Instantiation Step is Pre-LLM:** The process of taking the `ExecuteCommandToolWrapper` class and turning it into a runnable `DynamicStructuredTool` that is ready to execute commands is an **initialisation step** that must occur before the LLM can even be invoked. The instantiation is what binds the LLM's high-level tool _call_ to the low-level system _functionality_.

### 3. Supporting Mechanisms (Like HITL) are Architectural

The need to inject variables like `askApproval` is crucial because the agent system must handle **Human-in-the-Loop (HITL)** processes or structured error handling.

The LangGraph framework excels at managing these complex workflows and conditional logic (`ORCHESTRATE_CHECKPOINT`, `ORCHESTRATE_ROLLBACK`). However, the act of correctly passing the `askApproval` function (which enables the HITL pause/resume feature) into the tool object is an architectural requirement handled by the developer writing the factory code, not by the LLM itself.

In summary, the implementation of context-based tool instantiation is a foundational step in **Protocol Engineering**—creating the defined procedures and internal workflows that the LLM (the agent/specialist) will later utilize. It is pure code logic that ensures the tool has access to the operating environment (`runtime context`) when needed.
This architectural fix requires updating several files within the internal tooling and execution pipeline of RooCode, specifically focusing on the mechanism that initializes tools and binds them to the current execution context.

The implementation of **"Context-Based Instantiation for Tool Wrapper Classes"** involves updating the tool definition (the wrapper class), the registration mechanism, and the primary execution bridge.

## 1. Files to Create or Update (Internal RooCode)

The following files, implied by the structure and discussed concepts, would need modification, likely using TypeScript (`.ts`):

| File/Module                                                                          | Purpose of Update                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Relevant Concepts from Sources                                                                                                                       |
| :----------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`src/shared/tools.ts`**                                                            | **Defining the Execution Contract (Dependencies)**: This file contains the foundational types that define the required execution context, such as `AskApproval`, `HandleError`, `PushToolResult`, and `RemoveClosingTag`. A new interface, like `ToolExecutionContext`, should be defined here or centrally imported.                                                                                                                                                        | The core tool execution functions already explicitly list these dependencies.                                                                        |
| **`src/core/tools/IToolWrapperFactory.ts`** (Implicit/Needs creation)                | **Tool Factory Interface:** Defines the contract for creating a live tool instance, forcing all wrappers to implement a static `create` method that accepts the necessary runtime parameters.                                                                                                                                                                                                                                                                                | The concept is demonstrated by the static `create` method on tool constructors/exports, e.g., `WriteToFileToolWrapper.create`.                       |
| **`src/core/tools/{ToolName}ToolWrapper.ts`** (e.g., `ExecuteCommandToolWrapper.ts`) | **Wrapper Implementation Update:** The existing tool wrapper classes must be updated to implement the `IToolWrapperFactory` (or equivalent pattern). The static `create` method takes the entire execution context (e.g., `cline: Task`, `askApproval`, etc.) and uses those injected dependencies to construct the final `DynamicStructuredTool` instance, which encapsulates the legacy execution logic (`legacyToolFunction`).                                            | The construction pattern is visible in the export of `createWriteToFileTool`. The wrappers manage complex validation and execution logic internally. |
| **`src/core/orchestrator/TransitionalExecutor.ts`** (Implicit)                       | **Execution Bridge Logic Update:** This central component is where the agent loop runs and tools are passed to the LLM. It must be modified to: 1. Gather all necessary runtime dependencies (`Task`, `askApproval`, etc.). 2. Iterate over the registered tool **factories**. 3. Call the `.create(context)` factory method for each tool to produce the array of runnable `DynamicStructuredTool` instances required by the LLM (e.g., using a method like `bindTools()`). | The system currently handles execution context via the `Task` class. LangGraph relies on the execution runtime to correctly provide tools.           |
| **`src/services/tool/ToolDiscovery.ts`** (Implicit)                                  | **Registration Update:** The tool registration logic must be updated to store and manage tool wrappers as **factory references** rather than static classes or simple function pointers, solving the immediate `TODO:` of needing context for instantiation.                                                                                                                                                                                                                 | The prior conversation highlighted the need to move beyond storing the static class.                                                                 |

## 2. API Reference (Packages Needed or Already Installed)

The solution relies heavily on existing libraries used for creating structured, executable tools and managing asynchronous operations.

| Package                        | Specific Components Needed                                                                                                          | Purpose                                                                                                                                                                                                                                                        |
| :----------------------------- | :---------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`@roo-code/types`**          | `Task`, `ToolUse`, `AskApproval`, `HandleError`, `PushToolResult`, `RemoveClosingTag`, `ModeConfig`, `TodoItem`, `ProviderSettings` | Provides all essential internal data structures and the types defining the execution environment and context parameters being injected.                                                                                                                        |
| **`@langchain/core/tools`**    | **`tool()`** factory function, **`DynamicStructuredTool`**                                                                          | Essential for defining the wrapper's final output: a strongly typed tool instance that the LLM can use.                                                                                                                                                        |
| **`zod`**                      | **`z.object`**, `z.array`, etc.                                                                                                     | Used by the tool wrappers to define the input schema (`schema`) of the `DynamicStructuredTool`, ensuring type-safe parameters are passed from the LLM to the execution logic.                                                                                  |
| **`@langchain/core/messages`** | **`ToolMessage`**                                                                                                                   | Necessary for communicating the results of the tool execution back to the LLM within the agent loop, adhering to modern tool-calling standards.                                                                                                                |
| **LangGraph Libraries**        | (Implicitly the runtime environment)                                                                                                | While the LLM does not use LangGraph directly for tool execution, the overall agent orchestration environment is built on LangGraph/LangChain concepts, requiring that the instantiated tools be compatible with execution states and runnable configurations. |

Yes, based on the sources, the system employs **Human-in-the-Loop (HITL)** functionality specifically through a dedicated **middleware** component provided by the LangChain agent framework.

### Details of the HITL Middleware Implementation

The core mechanism for HITL is the explicit **`humanInTheLoopMiddleware`**. This middleware is integrated into the agent workflow to provide human oversight and ensure policy compliance for sensitive operations.

1.  **Architecture and Integration:**

    - The middleware uses the underlying capabilities of frameworks like LangGraph, which is designed for building stateful agents and natively supports **human-in-the-loop** workflows that persist through failures and can resume from where they left off.
    - The `humanInTheLoopMiddleware` is configured when creating an agent (`createAgent`) and operates in the `afterModel` phase, meaning it intercepts tool calls **after** the LLM decides to use them but **before** the tool is actually executed.
    - It requires a `checkpointer` to maintain state across interruptions.

2.  **Configuration and Control (`interruptOn`):**

    - The middleware is configured using an `interruptOn` mapping, which specifies which tools should trigger a pause for human review.
    - For example, tools like **`write_file`** are explicitly configured to interrupt execution, potentially requiring specific allowed decisions like `["approve", "reject"]`. Conversely, a `calculator` tool might be set to `false`, meaning it is auto-approved and executes immediately.
    - The configuration can be complex, allowing for tool-specific approval messages using a `description` string or a dynamic function (`DescriptionFactory`).

3.  **The Interrupt Mechanism:**
    - When an unapproved tool is called by the LLM, the middleware pauses the agent invocation, and the result contains an **`interrupt`** property.
    - The interrupt holds a **`HITLRequest`** payload, detailing the actions requested by the AI (`actionRequests`) and the valid options for review (`reviewConfigs`).
    - The human operator can then provide a **`HITLResponse`** with a decision for each pending action, which can be:
        - **`approve`**: Execute the tool with the original arguments.
        - **`edit`**: Modify the tool's arguments or name before execution.
        - **`reject`**: Provide a manual text response instead of executing the tool.

This process allows the system to incorporate human oversight for sensitive actions like file writing or calendar scheduling, fulfilling the need for human approval defined in typical workflow requirements.

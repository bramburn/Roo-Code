# Testing Strategy

This document outlines the comprehensive testing strategy for Retry Chat Output & Prompt Templates Enhancement (PRD-06).

## Testing Objectives

### Primary Objectives

1. **Functional Validation**: Ensure all retry visibility features work correctly
2. **Template System Testing**: Validate template engine functionality and customization
3. **Integration Testing**: Verify seamless integration with PRD-03 and existing systems
4. **Performance Testing**: Ensure minimal impact on system performance
5. **User Experience Testing**: Validate user interface and interaction patterns
6. **Security Testing**: Ensure template system security and input validation

### Success Criteria

- 95% test coverage for all new components
- Zero regression in existing PRD-03 functionality
- < 100ms additional latency for retry chat output
- < 2MB additional memory usage
- 100% backward compatibility with existing retry features

## Testing Scope

### 1. Unit Testing

#### 1.1 Template Engine Testing

**Test Files**: `src/core/templates/__tests__/RetryTemplateEngine.spec.ts`

**Test Cases**:

```typescript
describe("RetryTemplateEngine", () => {
	describe("Template Rendering", () => {
		test("should render retry start template with variables", async () => {
			const template = {
				id: "test_retry_start",
				template: "🔄 Retrying {{toolName}} ({{attemptNumber}}/{{maxAttempts}})",
				variables: ["toolName", "attemptNumber", "maxAttempts"],
			}

			const context = {
				toolName: "write_to_file",
				attemptNumber: 2,
				maxAttempts: 3,
			}

			const result = await templateEngine.render(template, context)
			expect(result).toBe("🔄 Retrying write_to_file (2/3)")
		})

		test("should handle missing variables gracefully", async () => {
			const template = {
				template: "Error: {{errorType}} - {{errorReason}}",
				variables: ["errorType", "errorReason"],
			}

			const context = { errorType: "TIMEOUT" }
			const result = await templateEngine.render(template, context)
			expect(result).toBe("Error: TIMEOUT - {{errorReason}}")
		})

		test("should validate template syntax", () => {
			const invalidTemplate = "Invalid {{variable syntax"
			const result = templateEngine.validateTemplate(invalidTemplate)
			expect(result.isValid).toBe(false)
			expect(result.errors).toContain("Invalid template syntax")
		})
	})

	describe("Variable Extraction", () => {
		test("should extract all template variables", () => {
			const template = "Retry {{attemptNumber}}/{{maxAttempts}} for {{toolName}}"
			const variables = templateEngine.extractVariables(template)
			expect(variables).toContain("attemptNumber")
			expect(variables).toContain("maxAttempts")
			expect(variables).toContain("toolName")
		})

		test("should handle duplicate variables", () => {
			const template = "{{toolName}} and {{toolName}} again"
			const variables = templateEngine.extractVariables(template)
			expect(variables).toEqual(["toolName"])
		})
	})

	describe("Default Templates", () => {
		test("should load all default templates", () => {
			const templates = templateEngine.getDefaultTemplates()
			expect(templates).toHaveLength(4) // retry_start, retry_progress, retry_success, retry_failure
			expect(templates.find((t) => t.category === "retry_start")).toBeDefined()
		})

		test("should validate default template variables", () => {
			const templates = templateEngine.getDefaultTemplates()
			templates.forEach((template) => {
				template.variables.forEach((variable) => {
					expect(variable.name).toMatch(/^[a-zA-Z_]+$/)
					expect(variable.description).toBeTruthy()
				})
			})
		})
	})
})
```

#### 1.2 Chat Output Manager Testing

**Test Files**: `src/core/webview/__tests__/RetryChatOutputManager.spec.ts`

**Test Cases**:

```typescript
describe("RetryChatOutputManager", () => {
	describe("Message Output", () => {
		test("should output retry start message", async () => {
			const retryContext = createMockRetryContext()
			await chatOutputManager.outputRetryMessage(retryContext, "retry_start")

			expect(mockChatOutput).toHaveBeenCalledWith(
				expect.objectContaining({
					type: "retry_start",
					toolName: "write_to_file",
					attemptNumber: 1,
					maxAttempts: 3,
				}),
			)
		})

		test("should consolidate multiple retry messages", async () => {
			const config = { consolidateMessages: true, maxMessagesPerRetry: 2 }
			chatOutputManager.updateConfig(config)

			// Send multiple progress messages
			await chatOutputManager.showRetryProgress(context, { stage: "analyzing", percentage: 25 })
			await chatOutputManager.showRetryProgress(context, { stage: "executing", percentage: 75 })

			// Should consolidate into single message
			expect(mockChatOutput).toHaveBeenCalledTimes(1)
			expect(mockChatOutput).toHaveBeenCalledWith(expect.stringContaining("🔄 write_to_file retry progress"))
		})

		test("should respect verbosity settings", async () => {
			const config = { verbosity: "minimal" }
			chatOutputManager.updateConfig(config)

			await chatOutputManager.outputRetryMessage(context, "retry_start")

			expect(mockChatOutput).toHaveBeenCalledWith(expect.stringContaining("🔄 Retrying"))
			expect(mockChatOutput).not.toHaveBeenCalledWith(expect.stringContaining("Error details"))
		})
	})

	describe("Progress Indicators", () => {
		test("should show progress updates", async () => {
			const progressStages = [
				{ stage: "analyzing", percentage: 25 },
				{ stage: "preparing", percentage: 50 },
				{ stage: "executing", percentage: 75 },
				{ stage: "validating", percentage: 90 },
			]

			for (const progress of progressStages) {
				await chatOutputManager.showRetryProgress(context, progress)
			}

			expect(mockChatOutput).toHaveBeenCalledTimes(4)
			expect(mockChatOutput).toHaveBeenLastCalledWith(expect.stringContaining("validating (90%)"))
		})

		test("should calculate estimated time remaining", async () => {
			const startTime = Date.now() - 5000 // 5 seconds ago
			const context = { ...mockContext, startTime }

			await chatOutputManager.showRetryProgress(context, {
				stage: "executing",
				percentage: 50,
			})

			expect(mockChatOutput).toHaveBeenCalledWith(expect.stringContaining("~5s remaining"))
		})
	})
})
```

#### 1.3 Settings Integration Testing

**Test Files**: `src/core/settings/__tests__/RetryVisibilitySettings.spec.ts`

**Test Cases**:

```typescript
describe("RetryVisibilitySettings", () => {
	describe("Schema Validation", () => {
		test("should validate valid settings", () => {
			const validSettings = {
				chatOutput: {
					enabled: true,
					verbosity: "standard",
					showProgress: true,
					consolidateMessages: true,
					maxMessagesPerRetry: 3,
					colorCoding: true,
				},
				promptTemplates: {
					customTemplates: [],
					activeTemplateIds: {},
					enablePreview: true,
					autoSave: true,
				},
			}

			const result = retryVisibilitySettingsSchema.safeParse(validSettings)
			expect(result.success).toBe(true)
		})

		test("should reject invalid verbosity", () => {
			const invalidSettings = {
				chatOutput: {
					verbosity: "invalid",
				},
			}

			const result = retryVisibilitySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
		})

		test("should enforce maxMessagesPerRetry limits", () => {
			const invalidSettings = {
				chatOutput: {
					maxMessagesPerRetry: 15, // Exceeds max of 10
				},
			}

			const result = retryVisibilitySettingsSchema.safeParse(invalidSettings)
			expect(result.success).toBe(false)
		})
	})

	describe("Settings Persistence", () => {
		test("should persist settings across sessions", async () => {
			const settings = createTestSettings()
			await settingsManager.saveSettings(settings)

			const loadedSettings = await settingsManager.loadSettings()
			expect(loadedSettings.retryVisibility).toEqual(settings)
		})

		test("should handle settings migration", async () => {
			// Simulate old settings format
			const oldSettings = {
				/* old format */
			}
			await settingsManager.saveLegacySettings(oldSettings)

			const newSettings = await settingsManager.loadSettings()
			expect(newSettings.retryVisibility).toBeDefined()
			expect(newSettings.retryVisibility.chatOutput.enabled).toBe(true) // Default value
		})
	})
})
```

### 2. Integration Testing

#### 2.1 PRD-03 Integration Testing

**Test Files**: `src/core/tools/retry/__tests__/RetryEngine.integration.spec.ts`

**Test Cases**:

```typescript
describe("PRD-03 Integration", () => {
	describe("Enhanced Retry Engine", () => {
		test("should maintain backward compatibility", async () => {
			const originalRetryEngine = new RetryEngine()
			const enhancedRetryEngine = new EnhancedRetryEngine()

			const toolCall = createMockToolCall()
			const context = createMockRetryContext()

			// Both should produce same results for successful execution
			const originalResult = await originalRetryEngine.executeWithRetry(toolCall, context)
			const enhancedResult = await enhancedRetryEngine.executeWithRetry(toolCall, context)

			expect(enhancedResult).toEqual(originalResult)
		})

		test("should output retry messages during execution", async () => {
			const enhancedRetryEngine = new EnhancedRetryEngine()
			const toolCall = createFailingToolCall() // Will trigger retry
			const context = createMockRetryContext()

			await enhancedRetryEngine.executeWithRetry(toolCall, context)

			expect(mockChatOutput).toHaveBeenCalledWith(expect.objectContaining({ type: "retry_start" }))
			expect(mockChatOutput).toHaveBeenCalledWith(expect.objectContaining({ type: "retry_progress" }))
		})

		test("should integrate with error classification", async () => {
			const enhancedRetryEngine = new EnhancedRetryEngine()
			const toolCall = createToolCallWithError("CONTEXT_WINDOW_EXCEEDED")
			const context = createMockRetryContext()

			await enhancedRetryEngine.executeWithRetry(toolCall, context)

			expect(mockChatOutput).toHaveBeenCalledWith(expect.stringContaining("CONTEXT_WINDOW_EXCEEDED"))
		})
	})

	describe("Context Optimization Integration", () => {
		test("should work with context optimization", async () => {
			const enhancedRetryEngine = new EnhancedRetryEngine()
			const toolCall = createMockToolCall()
			const context = createMockRetryContext({
				needsOptimization: true,
			})

			await enhancedRetryEngine.executeWithRetry(toolCall, context)

			expect(mockContextOptimizer).toHaveBeenCalledWith(expect.objectContaining({ retryContext: context }))
		})

		test("should maintain dual-history synchronization", async () => {
			const enhancedRetryEngine = new EnhancedRetryEngine()
			const toolCall = createMockToolCall()
			const context = createMockRetryContext()

			await enhancedRetryEngine.executeWithRetry(toolCall, context)

			expect(mockDualHistorySynchronizer).toHaveBeenCalled()
		})
	})
})
```

#### 2.2 Chat System Integration Testing

**Test Files**: `src/core/webview/__tests__/ChatIntegration.spec.ts`

**Test Cases**:

```typescript
describe("Chat System Integration", () => {
	describe("Message Rendering", () => {
		test("should render retry messages in chat", async () => {
			const retryMessage = createRetryChatMessage({
				type: "retry_start",
				template: "🔄 Retrying {{toolName}} ({{attemptNumber}}/{{maxAttempts}})",
				variables: { toolName: "write_to_file", attemptNumber: 1, maxAttempts: 3 },
			})

			await chatSystem.addMessage(retryMessage)

			const renderedMessage = chatSystem.getLastMessage()
			expect(renderedMessage.content).toBe("🔄 Retrying write_to_file (1/3)")
			expect(renderedMessage.type).toBe("retry")
		})

		test("should apply color coding for different retry states", async () => {
			const messages = [
				createRetryChatMessage({ type: "retry_start" }),
				createRetryChatMessage({ type: "retry_progress" }),
				createRetryChatMessage({ type: "retry_success" }),
				createRetryChatMessage({ type: "retry_failure" }),
			]

			for (const message of messages) {
				await chatSystem.addMessage(message)
				const renderedMessage = chatSystem.getLastMessage()

				expect(renderedMessage.className).toContain(`retry-${message.type}`)
			}
		})
	})

	describe("Message Consolidation", () => {
		test("should consolidate progress messages", async () => {
			const progressMessages = [
				createRetryChatMessage({ type: "retry_progress", stage: "analyzing" }),
				createRetryChatMessage({ type: "retry_progress", stage: "executing" }),
				createRetryChatMessage({ type: "retry_progress", stage: "validating" }),
			]

			for (const message of progressMessages) {
				await chatSystem.addMessage(message)
			}

			const consolidatedMessage = chatSystem.getLastMessage()
			expect(consolidatedMessage.content).toContain("🔄 retry progress")
			expect(consolidatedMessage.content).toContain("analyzing → executing → validating")
		})
	})
})
```

### 3. Performance Testing

#### 3.1 Chat Output Performance

**Test Files**: `src/core/webview/__tests__/performance/ChatOutput.performance.spec.ts`

**Test Cases**:

```typescript
describe("Chat Output Performance", () => {
	describe("Message Rendering Performance", () => {
		test("should render retry messages under 100ms", async () => {
			const startTime = performance.now()

			await chatOutputManager.outputRetryMessage(context, "retry_start")

			const endTime = performance.now()
			const duration = endTime - startTime

			expect(duration).toBeLessThan(100)
		})

		test("should handle high retry volume without degradation", async () => {
			const retryCount = 50
			const startTime = performance.now()

			for (let i = 0; i < retryCount; i++) {
				await chatOutputManager.outputRetryMessage(context, "retry_progress")
			}

			const endTime = performance.now()
			const averageTime = (endTime - startTime) / retryCount

			expect(averageTime).toBeLessThan(50) // Average per message
		})
	})

	describe("Template Rendering Performance", () => {
		test("should render complex templates under 50ms", async () => {
			const complexTemplate = {
				template:
					"🔄 {{toolName}} ({{attemptNumber}}/{{maxAttempts}})\nError: {{errorType}} - {{errorReason}}\nTimestamp: {{timestamp}}\nElapsed: {{elapsedTime}}ms",
				variables: [
					"toolName",
					"attemptNumber",
					"maxAttempts",
					"errorType",
					"errorReason",
					"timestamp",
					"elapsedTime",
				],
			}

			const startTime = performance.now()
			await templateEngine.render(complexTemplate, context)
			const endTime = performance.now()

			expect(endTime - startTime).toBeLessThan(50)
		})

		test("should cache rendered templates", async () => {
			const template = createTestTemplate()
			const context = createTestContext()

			// First render
			const startTime1 = performance.now()
			await templateEngine.render(template, context)
			const time1 = performance.now() - startTime1

			// Second render (should use cache)
			const startTime2 = performance.now()
			await templateEngine.render(template, context)
			const time2 = performance.now() - startTime2

			expect(time2).toBeLessThan(time1 * 0.1) // Should be much faster
		})
	})
})
```

#### 3.2 Memory Usage Testing

**Test Files**: `src/core/webview/__tests__/performance/MemoryUsage.spec.ts`

**Test Cases**:

```typescript
describe("Memory Usage Testing", () => {
	test("should maintain memory usage under 2MB additional", async () => {
		const initialMemory = getMemoryUsage()

		// Execute 100 retry operations
		for (let i = 0; i < 100; i++) {
			await chatOutputManager.outputRetryMessage(context, "retry_progress")
		}

		const finalMemory = getMemoryUsage()
		const memoryIncrease = finalMemory - initialMemory

		expect(memoryIncrease).toBeLessThan(2 * 1024 * 1024) // 2MB
	})

	test("should clean up old retry messages", async () => {
		// Generate many retry messages
		for (let i = 0; i < 1000; i++) {
			await chatOutputManager.outputRetryMessage(context, "retry_progress")
		}

		const messageCount = chatSystem.getMessageCount()
		expect(messageCount).toBeLessThan(100) // Should have cleanup
	})
})
```

### 4. User Experience Testing

#### 4.1 Settings UI Testing

**Test Files**: `webview-ui/src/components/settings/__tests__/RetryVisibilitySettings.spec.tsx`

**Test Cases**:

```typescript
describe("RetryVisibilitySettings UI", () => {
  describe("Template Editor", () => {
    test("should provide real-time template preview", async () => {
      const { getByLabelText, getByText } = render(<RetryVisibilitySettings />)

      const templateTextarea = getByLabelText('Retry Start Template')
      const previewArea = getByText('Template Preview')

      fireEvent.change(templateTextarea, { target: { value: '🔄 {{toolName}} retry' } })

      await waitFor(() => {
        expect(previewArea).toHaveTextContent('🔄 [tool name] retry')
      })
    })

    test("should validate template syntax", async () => {
      const { getByLabelText, getByText } = render(<RetryVisibilitySettings />)

      const templateTextarea = getByLabelText('Retry Start Template')

      fireEvent.change(templateTextarea, { target: { value: 'Invalid {{variable' } })

      await waitFor(() => {
        expect(getByText('Invalid template syntax')).toBeInTheDocument()
      })
    })
  })

  describe("Settings Controls", () => {
    test("should persist settings changes", async () => {
      const { getByLabelText } = render(<RetryVisibilitySettings />)

      const verbositySelect = getByLabelText('Verbosity Level')
      fireEvent.change(verbositySelect, { target: { value: 'detailed' } })

      const saveButton = getByText('Save Settings')
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(mockSettingsSave).toHaveBeenCalledWith(
          expect.objectContaining({
            chatOutput: expect.objectContaining({
              verbosity: 'detailed'
            })
          })
        )
      })
    })
  })
})
```

#### 4.2 Accessibility Testing

**Test Files**: `webview-ui/src/components/settings/__tests__/accessibility.spec.tsx`

**Test Cases**:

```typescript
describe("Accessibility Testing", () => {
  test("should have proper ARIA labels", () => {
    const { getByLabelText } = render(<RetryVisibilitySettings />)

    expect(getByLabelText('Enable Retry Chat Output')).toBeInTheDocument()
    expect(getByLabelText('Verbosity Level')).toBeInTheDocument()
    expect(getByLabelText('Template Editor')).toBeInTheDocument()
  })

  test("should support keyboard navigation", async () => {
    const { getByLabelText } = render(<RetryVisibilitySettings />)

    const verbositySelect = getByLabelText('Verbosity Level')
    verbositySelect.focus()

    fireEvent.keyDown(verbositySelect, { key: 'ArrowDown' })
    fireEvent.keyDown(verbositySelect, { key: 'Enter' })

    expect(verbositySelect).toHaveValue('standard')
  })

  test("should announce changes to screen readers", async () => {
    const { getByLabelText } = render(<RetryVisibilitySettings />)

    const enableToggle = getByLabelText('Enable Retry Chat Output')
    fireEvent.click(enableToggle)

    await waitFor(() => {
      expect(mockAnnouncer).toHaveBeenCalledWith('Retry chat output enabled')
    })
  })
})
```

### 5. Security Testing

#### 5.1 Template Security Testing

**Test Files**: `src/core/templates/__tests__/security/TemplateSecurity.spec.ts`

**Test Cases**:

```typescript
describe("Template Security", () => {
	describe("Input Validation", () => {
		test("should prevent code injection in templates", async () => {
			const maliciousTemplate = '<script>alert("xss")</script> {{toolName}}'
			const context = { toolName: "write_to_file" }

			const result = await templateEngine.render(maliciousTemplate, context)

			expect(result).not.toContain("<script>")
			expect(result).toBe(" [toolName]") // Sanitized
		})

		test("should validate template variables", () => {
			const invalidVariables = ["__proto__", "constructor", "prototype"]

			invalidVariables.forEach((variable) => {
				const template = `{{${variable}}}`
				const result = templateEngine.validateTemplate(template)
				expect(result.isValid).toBe(false)
				expect(result.errors).toContain(`Invalid variable: ${variable}`)
			})
		})
	})

	describe("Content Sanitization", () => {
		test("should sanitize error messages", async () => {
			const context = {
				errorReason: '<img src=x onerror=alert("xss")>',
			}

			const result = await templateEngine.render(errorTemplate, context)

			expect(result).not.toContain("<img")
			expect(result).not.toContain("onerror")
			expect(result).not.toContain("alert")
		})

		test("should escape template output for chat", async () => {
			const context = {
				toolName: "<script>malicious()</script>",
			}

			const result = await templateEngine.render(template, context)

			expect(result).toContain("<script>")
			expect(result).not.toContain("<script>")
		})
	})
})
```

### 6. End-to-End Testing

#### 6.1 Complete Workflow Testing

**Test Files**: `src/__tests__/e2e/RetryVisibility.e2e.spec.ts`

**Test Cases**:

```typescript
describe("End-to-End Retry Visibility", () => {
	test("should show complete retry workflow in chat", async () => {
		// Setup: Configure retry settings
		await page.goto("/settings")
		await page.click('[data-testid="enable-retry-chat-output"]')
		await page.selectOption('[data-testid="verbosity-level"]', "standard")
		await page.click('[data-testid="save-settings"]')

		// Execute: Trigger retry scenario
		await page.goto("/workspace")
		await page.fill('[data-testid="file-path"]', "/test/large-file.txt")
		await page.click('[data-testid="write-file-button"]')

		// Verify: Check chat for retry messages
		await expect(page.locator('[data-testid="retry-start-message"]')).toBeVisible()
		await expect(page.locator('[data-testid="retry-progress-message"]')).toBeVisible()
		await expect(page.locator('[data-testid="retry-success-message"]')).toBeVisible()

		// Verify message content
		const retryMessage = await page.locator('[data-testid="retry-start-message"]').textContent()
		expect(retryMessage).toContain("🔄 Retrying write_to_file")
		expect(retryMessage).toContain("(1/3)")
	})

	test("should allow template customization", async () => {
		await page.goto("/settings")
		await page.click('[data-testid="retry-templates-tab"]')

		// Customize template
		await page.fill('[data-testid="retry-start-template"]', "🔄 Custom retry {{toolName}}")
		await page.click('[data-testid="preview-template"]')

		// Verify preview
		const preview = await page.locator('[data-testid="template-preview"]').textContent()
		expect(preview).toContain("🔄 Custom retry [tool name]")

		// Save and test
		await page.click('[data-testid="save-templates"]')

		// Trigger retry to see custom template
		await page.goto("/workspace")
		await page.click('[data-testid="trigger-retry"]')

		const customMessage = await page.locator('[data-testid="retry-start-message"]').textContent()
		expect(customMessage).toContain("🔄 Custom retry")
	})
})
```

## Test Environment Setup

### Local Development

- **Node.js**: Latest LTS version
- **TypeScript**: Version 5.0+
- **Testing Framework**: Vitest
- **Browser**: Chrome latest for E2E tests

### CI/CD Pipeline

- **Unit Tests**: Run on every PR
- **Integration Tests**: Run on every merge to main
- **Performance Tests**: Run nightly
- **E2E Tests**: Run on release candidates
- **Security Tests**: Run on every build

### Test Data Management

#### Mock Data

- **Retry Context**: Comprehensive mock retry scenarios
- **Error Types**: All error classification types from PRD-03
- **Template Variables**: Complete variable set for testing
- **Settings States**: Various settings configurations

#### Test Fixtures

- **Tool Calls**: Mock tool calls for different scenarios
- **Chat Messages**: Sample retry messages for validation
- **Templates**: Default and custom template examples
- **User Interactions**: Common user workflow patterns

## Performance Benchmarks

### Target Metrics

- **Message Rendering**: < 100ms per retry message
- **Template Processing**: < 50ms per template render
- **Settings Operations**: < 200ms for save/load
- **Memory Usage**: < 2MB additional overhead
- **Bundle Size**: < 50KB additional code

### Monitoring

- **Performance Regression**: Automated performance monitoring
- **Memory Leaks**: Continuous memory usage tracking
- **Bundle Analysis**: Regular bundle size analysis
- **User Experience**: Real-user performance metrics

## Quality Gates

### Code Coverage

- **Unit Tests**: Minimum 95% coverage
- **Integration Tests**: Minimum 90% coverage
- **E2E Tests**: Minimum 80% coverage of user workflows

### Performance Gates

- **All performance tests must pass**
- **Memory usage within specified limits**
- **Bundle size increase within acceptable range**
- **No performance regressions in existing features**

### Security Gates

- **All security tests must pass**
- **No XSS vulnerabilities in template rendering**
- **Proper input validation and sanitization**
- **Secure template storage and management**

## Test Execution Plan

### Phase 1: Foundation (Weeks 1-2)

- Unit tests for template engine
- Unit tests for chat output manager
- Settings integration tests
- Basic performance benchmarks

### Phase 2: Integration (Weeks 3-4)

- PRD-03 integration tests
- Chat system integration tests
- End-to-end workflow tests
- Security validation tests

### Phase 3: Validation (Weeks 5-6)

- Performance testing under load
- Memory usage validation
- User experience testing
- Accessibility compliance testing
- Cross-platform compatibility testing

---

**Last Updated**: 2024-01-15  
**Test Framework**: Vitest + Playwright  
**Coverage Target**: 95%+  
**Performance Budget**: < 100ms message rendering, < 2MB memory

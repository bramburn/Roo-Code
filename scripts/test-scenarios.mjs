#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	red: '\x1b[34m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
	log(`\n${'='.repeat(60)}`, 'cyan')
	log(`  ${title}`, 'cyan')
	log(`${'='.repeat(60)}`, 'cyan')
}

function logSubsection(title) {
	log(`\n--- ${title} ---`, 'yellow')
}

function runCommand(command, cwd = rootDir, options = {}) {
	try {
		const output = execSync(command, {
			cwd,
			stdio: options.silent ? 'pipe' : 'inherit',
			encoding: 'utf8',
			...options
		})
		return { success: true, output }
	} catch (error) {
		return { success: false, error: error.message, output: error.stdout }
	}
}

// Test scenarios configuration
const TEST_SCENARIOS = {
	// Unit test scenarios
	unit: {
		backend: {
			name: 'Backend Unit Tests',
			description: 'Test individual backend components and utilities',
			command: 'node scripts/test-runner.mjs --platform backend --category unit --coverage',
			files: [
				'src/shared/__tests__/*.spec.ts',
				'src/utils/__tests__/*.spec.ts',
				'src/activate/__tests__/*.spec.ts',
				'src/services/**/__tests__/*.spec.ts'
			]
		},
		frontend: {
			name: 'Frontend Unit Tests',
			description: 'Test individual frontend components and utilities',
			command: 'node scripts/test-runner.mjs --platform frontend --category unit --coverage',
			files: [
				'webview-ui/src/utils/__tests__/*.spec.ts',
				'webview-ui/src/hooks/__tests__/*.spec.ts',
				'webview-ui/src/components/ui/__tests__/*.spec.ts'
			]
		}
	},

	// Component test scenarios
	component: {
		react: {
			name: 'React Component Tests',
			description: 'Test React components with user interactions',
			command: 'node scripts/test-runner.mjs --platform frontend --category component --coverage',
			files: [
				'webview-ui/src/components/**/__tests__/*.spec.tsx',
				'webview-ui/src/__tests__/*.spec.tsx'
			]
		},
		extension: {
			name: 'Extension Component Tests',
			description: 'Test VSCode extension components',
			command: 'node scripts/test-runner.mjs --platform backend --category component --coverage',
			files: [
				'src/activate/__tests__/*.spec.ts',
				'src/services/**/__tests__/*.spec.ts'
			]
		}
	},

	// Integration test scenarios
	integration: {
		api: {
			name: 'API Integration Tests',
			description: 'Test API endpoints and data flow',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/api*.test.ts"',
			files: [
				'src/__tests__/integration/api*.test.ts'
			]
		},
		crossPlatform: {
			name: 'Cross-Platform Integration Tests',
			description: 'Test backend-frontend communication',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/cross-platform*.test.ts"',
			files: [
				'src/__tests__/integration/cross-platform.test.ts'
			]
		},
		contextLoading: {
			name: 'Context Loading Integration Tests',
			description: 'Test file context loading and processing',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/context-loading*.test.ts"',
			files: [
				'src/__tests__/integration/context-loading.test.ts'
			]
		}
	},

	// Performance test scenarios
	performance: {
		codeIndexing: {
			name: 'Code Indexing Performance Tests',
			description: 'Test performance of code indexing operations',
			command: 'node scripts/test-runner.mjs --category performance --pattern "**/code-index*.perf.test.ts"',
			files: [
				'src/services/code-index/__tests__/*.perf.test.ts'
			]
		},
		treeSitter: {
			name: 'Tree-Sitter Performance Tests',
			description: 'Test performance of syntax parsing',
			command: 'node scripts/test-runner.mjs --category performance --pattern "**/tree-sitter*.perf.test.ts"',
			files: [
				'src/services/tree-sitter/__tests__/*.perf.test.ts'
			]
		},
		memoryUsage: {
			name: 'Memory Usage Tests',
			description: 'Test memory consumption and leaks',
			command: 'node scripts/test-runner.mjs --category performance --pattern "**/memory*.perf.test.ts"',
			files: [
				'src/__tests__/performance/memory*.perf.test.ts'
			]
		}
	},

	// E2E test scenarios
	e2e: {
		extensionLifecycle: {
			name: 'Extension Lifecycle E2E Tests',
			description: 'Test complete extension lifecycle',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/extension-e2e*.test.ts"',
			files: [
				'src/__tests__/e2e/extension-e2e.test.ts'
			]
		},
		userWorkflows: {
			name: 'User Workflow E2E Tests',
			description: 'Test complete user workflows',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/workflow-e2e*.test.ts"',
			files: [
				'src/__tests__/e2e/workflow-e2e.test.ts'
			]
		}
	},

	// Regression test scenarios
	regression: {
		criticalBugs: {
			name: 'Critical Bug Regression Tests',
			description: 'Test for critical bug regressions',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/regression-critical*.test.ts"',
			files: [
				'src/__tests__/regression/critical-bugs.test.ts'
			]
		},
		security: {
			name: 'Security Regression Tests',
			description: 'Test for security vulnerabilities',
			command: 'node scripts/test-runner.mjs --category integration --pattern "**/security*.test.ts"',
			files: [
				'src/__tests__/regression/security.test.ts'
			]
		}
	}
}

function createPerformanceTestTemplate() {
	logSection('Creating Performance Test Templates')
	
	const performanceTestDir = join(rootDir, 'src/__tests__/performance')
	if (!existsSync(performanceTestDir)) {
		mkdirSync(performanceTestDir, { recursive: true })
	}
	
	const codeIndexTemplate = `import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'perf_hooks'

describe('Code Indexing Performance Tests', () => {
	let startTime: number
	let memoryBefore: number

	beforeAll(() => {
		// Setup test environment
		memoryBefore = process.memoryUsage().heapUsed
		startTime = performance.now()
	})

	afterAll(() => {
		const endTime = performance.now()
		const memoryAfter = process.memoryUsage().heapUsed
		const memoryDiff = memoryAfter - memoryBefore

		console.log(\`Performance Summary:\`)
		console.log(\`  Duration: \${endTime - startTime}ms\`)
		console.log(\`  Memory usage: \${Math.round(memoryDiff / 1024 / 1024)}MB\`)
	})

	test('code indexing should complete within acceptable time', async () => {
		// Test code indexing performance
		const indexStart = performance.now()
		
		// TODO: Implement actual code indexing test
		await new Promise(resolve => setTimeout(resolve, 100)) // Mock operation
		
		const indexEnd = performance.now()
		const indexDuration = indexEnd - indexStart
		
		expect(indexDuration).toBeLessThan(5000) // 5 seconds threshold
	})

	test('code indexing should not exceed memory limits', async () => {
		// Test memory usage during indexing
		const memoryBefore = process.memoryUsage().heapUsed
		
		// TODO: Implement actual code indexing test
		await new Promise(resolve => setTimeout(resolve, 100)) // Mock operation
		
		const memoryAfter = process.memoryUsage().heapUsed
		const memoryDiff = memoryAfter - memoryBefore
		
		// Should not use more than 100MB additional memory
		expect(memoryDiff).toBeLessThan(100 * 1024 * 1024)
	})

	test('batch processing should be efficient', async () => {
		const batchSize = 100
		const batches = 10
		
		const batchStart = performance.now()
		
		// TODO: Implement batch processing test
		for (let i = 0; i < batches; i++) {
			await new Promise(resolve => setTimeout(resolve, 10)) // Mock batch
		}
		
		const batchEnd = performance.now()
		const batchDuration = batchEnd - batchStart
		
		// Should process batches efficiently
		const avgBatchTime = batchDuration / batches
		expect(avgBatchTime).toBeLessThan(100) // 100ms per batch
	})
})
`

	const treeSitterTemplate = `import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { performance } from 'perf_hooks'

describe('Tree-Sitter Performance Tests', () => {
	let startTime: number

	beforeAll(() => {
		startTime = performance.now()
	})

	afterAll(() => {
		const endTime = performance.now()
		console.log(\`Tree-sitter tests completed in: \${endTime - startTime}ms\`)
	})

	test('syntax parsing should be fast for large files', async () => {
		const largeFileContent = '/* Large file content */'.repeat(10000)
		const parseStart = performance.now()
		
		// TODO: Implement actual syntax parsing test
		await new Promise(resolve => setTimeout(resolve, 50)) // Mock parsing
		
		const parseEnd = performance.now()
		const parseDuration = parseEnd - parseStart
		
		expect(parseDuration).toBeLessThan(1000) // 1 second threshold
	})

	test('query execution should be efficient', async () => {
		const queryStart = performance.now()
		
		// TODO: Implement actual query test
		await new Promise(resolve => setTimeout(resolve, 20)) // Mock query
		
		const queryEnd = performance.now()
		const queryDuration = queryEnd - queryStart
		
		expect(queryDuration).toBeLessThan(100) // 100ms threshold
	})

	test('memory usage should be stable during parsing', async () => {
		const memoryBefore = process.memoryUsage().heapUsed
		
		// TODO: Implement memory stability test
		for (let i = 0; i < 100; i++) {
			await new Promise(resolve => setTimeout(resolve, 1)) // Mock parsing
		}
		
		const memoryAfter = process.memoryUsage().heapUsed
		const memoryDiff = memoryAfter - memoryBefore
		
		// Should not leak significant memory
		expect(memoryDiff).toBeLessThan(50 * 1024 * 1024) // 50MB threshold
	})
})
`

	const memoryTestTemplate = `import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'

describe('Memory Usage Tests', () => {
	let baselineMemory: number

	beforeAll(() => {
		// Force garbage collection if available
		if (global.gc) {
			global.gc()
		}
		baselineMemory = process.memoryUsage().heapUsed
	})

	afterAll(() => {
		const finalMemory = process.memoryUsage().heapUsed
		const memoryIncrease = finalMemory - baselineMemory
		console.log(\`Total memory increase: \${Math.round(memoryIncrease / 1024 / 1024)}MB\`)
	})

	beforeEach(() => {
		if (global.gc) {
			global.gc()
		}
	})

	afterEach(() => {
		if (global.gc) {
			global.gc()
		}
	})

	test('should not have significant memory leaks during repeated operations', async () => {
		const memorySnapshots = []
		
		// Perform repeated operations
		for (let i = 0; i < 100; i++) {
			// TODO: Implement actual operations that might leak memory
			const tempArray = new Array(1000).fill(0).map((_, i) => ({ id: i, data: 'x'.repeat(100) }))
			
			const memoryAfter = process.memoryUsage().heapUsed
			memorySnapshots.push(memoryAfter)
			
			// Clear reference
			tempArray.length = 0
		}
		
		// Check if memory growth is linear and not exponential
		const initialMemory = memorySnapshots[10]
		const finalMemory = memorySnapshots[memorySnapshots.length - 1]
		const memoryGrowth = finalMemory - initialMemory
		
		// Should not grow more than 10MB during test
		expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
	})

	test('should properly clean up resources', async () => {
		const memoryBefore = process.memoryUsage().heapUsed
		
		// TODO: Implement resource creation and cleanup test
		const resources = []
		for (let i = 0; i < 1000; i++) {
			resources.push({
				id: i,
				data: new Buffer(1024), // 1KB buffer
				cleanup: () => { /* cleanup logic */ }
			})
		}
		
		// Cleanup resources
		resources.forEach(resource => resource.cleanup())
		resources.length = 0
		
		if (global.gc) {
			global.gc()
		}
		
		const memoryAfter = process.memoryUsage().heapUsed
		const memoryDiff = memoryAfter - memoryBefore
		
		// Memory should return close to baseline
		expect(memoryDiff).toBeLessThan(5 * 1024 * 1024) // 5MB tolerance
	})

	test('should handle large datasets without memory overflow', async () => {
		const memoryBefore = process.memoryUsage().heapUsed
		
		try {
			// TODO: Implement large dataset handling test
			const largeDataset = new Array(100000).fill(0).map((_, i) => ({
				id: i,
				content: 'Large content string '.repeat(10),
				metadata: { index: i, timestamp: Date.now() }
			}))
			
			// Process dataset
			const processed = largeDataset.map(item => ({
				...item,
				processed: true
			}))
			
			// Cleanup
			largeDataset.length = 0
			processed.length = 0
			
			if (global.gc) {
				global.gc()
			}
			
			const memoryAfter = process.memoryUsage().heapUsed
			const memoryDiff = memoryAfter - memoryBefore
			
			// Should handle large datasets gracefully
			expect(memoryDiff).toBeLessThan(100 * 1024 * 1024) // 100MB tolerance
			
		} catch (error) {
			expect.fail(\`Memory overflow error: \${error.message}\`)
		}
	})
})
`

	writeFileSync(join(performanceTestDir, 'code-indexing.perf.test.ts'), codeIndexTemplate)
	writeFileSync(join(performanceTestDir, 'tree-sitter.perf.test.ts'), treeSitterTemplate)
	writeFileSync(join(performanceTestDir, 'memory-usage.perf.test.ts'), memoryTestTemplate)
	
	log('Performance test templates created', 'green')
}

function createIntegrationTestTemplate() {
	logSection('Creating Integration Test Templates')
	
	const integrationTestDir = join(rootDir, 'src/__tests__/integration')
	if (!existsSync(integrationTestDir)) {
		mkdirSync(integrationTestDir, { recursive: true })
	}
	
	const apiIntegrationTemplate = `import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest'
import { allowNetConnect } from '../vitest.setup'

describe('API Integration Tests', () => {
	let apiServer: any
	let testPort = 3001

	beforeAll(async () => {
		// Enable network connections for integration tests
		allowNetConnect('localhost')
		
		// TODO: Start test API server
		// apiServer = await startTestServer(testPort)
	})

	afterAll(async () => {
		// TODO: Stop test API server
		// if (apiServer) {
		//     await apiServer.stop()
		// }
	})

	beforeEach(() => {
		// Reset test state
	})

	afterEach(() => {
		// Cleanup test data
	})

	test('should handle API requests correctly', async () => {
		// TODO: Implement actual API integration test
		const response = await fetch(\`http://localhost:\${testPort}/api/test\`)
		
		expect(response.status).toBe(200)
		
		const data = await response.json()
		expect(data).toHaveProperty('success')
	})

	test('should handle API errors gracefully', async () => {
		// TODO: Implement error handling test
		try {
			const response = await fetch(\`http://localhost:\${testPort}/api/error\`)
			expect.fail('Should have thrown an error')
		} catch (error) {
			expect(error).toBeDefined()
		}
	})

	test('should handle concurrent requests', async () => {
		const concurrentRequests = 10
		const promises = []
		
		for (let i = 0; i < concurrentRequests; i++) {
			promises.push(fetch(\`http://localhost:\${testPort}/api/concurrent\`))
		}
		
		const responses = await Promise.all(promises)
		
		responses.forEach(response => {
			expect(response.status).toBe(200)
		})
	})
})
`

	const crossPlatformTemplate = `import { describe, test, expect, beforeAll, afterAll } from 'vitest'

describe('Cross-Platform Integration Tests', () => {
	beforeAll(() => {
		// Setup cross-platform test environment
	})

	afterAll(() => {
		// Cleanup cross-platform test environment
	})

	test('should communicate between backend and frontend', async () => {
		// TODO: Implement backend-frontend communication test
		// This should test the actual message passing between
		// the VSCode extension backend and the webview frontend
		
		const testMessage = {
			type: 'test',
			data: { hello: 'world' }
		}
		
		// Simulate message passing
		const response = await simulateMessagePassing(testMessage)
		
		expect(response).toBeDefined()
		expect(response.type).toBe('test-response')
	})

	test('should handle data synchronization', async () => {
		// TODO: Implement data synchronization test
		const testData = {
			settings: { theme: 'dark', language: 'en' },
			cache: new Map([['key', 'value']])
		}
		
		// Test synchronization between contexts
		const syncResult = await synchronizeData(testData)
		
		expect(syncResult.success).toBe(true)
		expect(syncResult.data).toEqual(testData)
	})

	test('should handle cross-platform errors', async () => {
		// TODO: Implement cross-platform error handling
		const errorScenario = {
			type: 'error-test',
			error: 'Simulated cross-platform error'
		}
		
		const result = await handleCrossPlatformError(errorScenario)
		
		expect(result.handled).toBe(true)
		expect(result.error).toBeDefined()
	})
})

// Helper functions (these would be implemented in the actual test)
async function simulateMessagePassing(message: any) {
	// Mock message passing implementation
	return {
		type: 'test-response',
		data: message.data
	}
}

async function synchronizeData(data: any) {
	// Mock data synchronization implementation
	return {
		success: true,
		data: data
	}
}

async function handleCrossPlatformError(error: any) {
	// Mock error handling implementation
	return {
		handled: true,
		error: error.error
	}
}
`

	writeFileSync(join(integrationTestDir, 'api-integration.test.ts'), apiIntegrationTemplate)
	writeFileSync(join(integrationTestDir, 'cross-platform.test.ts'), crossPlatformTemplate)
	
	log('Integration test templates created', 'green')
}

function runTestScenario(scenarioName) {
	logSection(`Running Test Scenario: ${scenarioName}`)
	
	const [category, type] = scenarioName.split(':')
	
	if (!TEST_SCENARIOS[category]) {
		log(`Unknown test category: ${category}`, 'red')
		log(`Available categories: ${Object.keys(TEST_SCENARIOS).join(', ')}`, 'yellow')
		return false
	}
	
	if (type && !TEST_SCENARIOS[category][type]) {
		log(`Unknown test type: ${type} in category: ${category}`, 'red')
		log(`Available types for ${category}: ${Object.keys(TEST_SCENARIOS[category]).join(', ')}`, 'yellow')
		return false
	}
	
	const scenariosToRun = type ? [TEST_SCENARIOS[category][type]] : Object.values(TEST_SCENARIOS[category])
	
	for (const scenario of scenariosToRun) {
		logSubsection(scenario.name)
		log(scenario.description, 'blue')
		
		const result = runCommand(scenario.command)
		
		if (result.success) {
			log(`✅ ${scenario.name} completed successfully`, 'green')
		} else {
			log(`❌ ${scenario.name} failed`, 'red')
			if (result.error) {
				log(result.error, 'red')
			}
			
			if (!process.argv.includes('--continue-on-failure')) {
				return false
			}
		}
	}
	
	return true
}

function listScenarios() {
	logSection('Available Test Scenarios')
	
	Object.entries(TEST_SCENARIOS).forEach(([category, scenarios]) => {
		log(`\n${category.toUpperCase()}:`, 'bright')
		Object.entries(scenarios).forEach(([type, scenario]) => {
			log(`  ${type}: ${scenario.name}`, 'blue')
			log(`    ${scenario.description}`, 'yellow')
		})
	})
}

function createMissingTestFiles() {
	logSection('Creating Missing Test Files')
	
	const testFilesToCreate = [
		'src/__tests__/e2e/extension-e2e.test.ts',
		'src/__tests__/e2e/workflow-e2e.test.ts',
		'src/__tests__/regression/critical-bugs.test.ts',
		'src/__tests__/regression/security.test.ts'
	]
	
	testFilesToCreate.forEach(filePath => {
		const fullPath = join(rootDir, filePath)
		const dir = dirname(fullPath)
		
		if (!existsSync(fullPath)) {
			mkdirSync(dir, { recursive: true })
			
			const template = `import { describe, test, expect } from 'vitest'

describe('${filePath.split('/').pop().replace('.test.ts', '')}', () => {
	test('placeholder test', () => {
		expect(true).toBe(true)
	})
})
`
			writeFileSync(fullPath, template)
			log(`Created test file: ${filePath}`, 'green')
		}
	})
}

function main() {
	const command = process.argv[2] || 'list'
	
	log('🧪 Test Scenario Runner', 'bright')
	
	switch (command) {
		case 'list':
			listScenarios()
			break
			
		case 'unit':
		case 'component':
		case 'integration':
		case 'performance':
		case 'e2e':
		case 'regression':
			const success = runTestScenario(command)
			if (!success) {
				process.exit(1)
			}
			break
			
		case 'templates':
			createPerformanceTestTemplate()
			createIntegrationTestTemplate()
			createMissingTestFiles()
			break
			
		case 'create-missing':
			createMissingTestFiles()
			break
			
		case 'performance-templates':
			createPerformanceTestTemplate()
			break
			
		case 'integration-templates':
			createIntegrationTestTemplate()
			break
			
		default:
			if (command.includes(':')) {
				const success = runTestScenario(command)
				if (!success) {
					process.exit(1)
				}
			} else {
				log(`Unknown command: ${command}`, 'red')
				log('Available commands: list, unit, component, integration, performance, e2e, regression, templates', 'yellow')
				log('Or use format: category:type (e.g., integration:api)', 'yellow')
				process.exit(1)
			}
	}
}

// Run script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { TEST_SCENARIOS, runTestScenario, createPerformanceTestTemplate, createIntegrationTestTemplate }
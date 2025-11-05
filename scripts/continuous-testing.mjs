#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, writeFileSync, mkdirSync, readFileSync, watchFile, unwatchFile } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'
import { performance } from 'perf_hooks'

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

// Continuous testing configuration
const CONTINUOUS_TESTING_CONFIG = {
	// Watch patterns for different file types
	watchPatterns: {
		backend: [
			'src/**/*.ts',
			'!src/**/*.test.ts',
			'!src/**/*.spec.ts',
			'!src/**/dist/**'
		],
		frontend: [
			'webview-ui/src/**/*.{ts,tsx}',
			'!webview-ui/src/**/*.test.ts',
			'!webview-ui/src/**/*.spec.ts',
			'!webview-ui/src/**/dist/**'
		],
		shared: [
			'packages/types/src/**/*.ts',
			'shared/**/*.ts'
		]
	},

	// Test commands for different scenarios
	testCommands: {
		backend: {
			unit: 'node scripts/test-runner.mjs --platform backend --category unit --coverage',
			integration: 'node scripts/test-runner.mjs --category integration --pattern "src/**/integration/*.test.ts"',
			component: 'node scripts/test-runner.mjs --platform backend --category component'
		},
		frontend: {
			unit: 'node scripts/test-runner.mjs --platform frontend --category unit --coverage',
			component: 'node scripts/test-runner.mjs --platform frontend --category component --coverage'
		}
	},

	// Debounce time in milliseconds
	debounceTime: 1000,

	// Maximum number of test failures before stopping
	maxFailures: 5,

	// Whether to run tests on startup
	runOnStartup: true,

	// Whether to generate reports after test runs
	generateReports: true
}

class ContinuousTestRunner {
	constructor(options = {}) {
		this.options = { ...CONTINUOUS_TESTING_CONFIG, ...options }
		this.isRunning = false
		this.failureCount = 0
		this.lastRunTime = 0
		this.debounceTimer = null
		this.watchedFiles = new Set()
		this.testResults = []
		this.startTime = Date.now()
	}

	async start() {
		if (this.isRunning) {
			log('Continuous testing is already running', 'yellow')
			return
		}

		logSection('Starting Continuous Testing')
		log('Watch patterns:', 'blue')
		Object.entries(this.options.watchPatterns).forEach(([type, patterns]) => {
			log(`  ${type}: ${patterns.join(', ')}`, 'blue')
		})

		this.isRunning = true
		this.failureCount = 0
		this.startTime = Date.now()

		if (this.options.runOnStartup) {
			logSubsection('Running Initial Test Suite')
			await this.runAllTests()
		}

		this.setupFileWatchers()
		this.startStatusReporter()

		log('✅ Continuous testing started', 'green')
		log('Press Ctrl+C to stop', 'yellow')

		// Handle graceful shutdown
		process.on('SIGINT', () => this.stop())
		process.on('SIGTERM', () => this.stop())
	}

	stop() {
		if (!this.isRunning) {
			return
		}

		log('\n🛑 Stopping continuous testing...', 'yellow')
		this.isRunning = false

		// Clear debounce timer
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}

		// Generate final report
		if (this.options.generateReports) {
			this.generateFinalReport()
		}

		log('📊 Final Statistics:', 'bright')
		log(`  Total runs: ${this.testResults.length}`, 'blue')
		log(`  Total failures: ${this.failureCount}`, this.failureCount > 0 ? 'red' : 'green')
		log(`  Duration: ${Math.round((Date.now() - this.startTime) / 1000)}s`, 'blue')

		process.exit(0)
	}

	setupFileWatchers() {
		// This is a simplified file watcher implementation
		// In a real implementation, you'd use a more sophisticated watching library
		logSubsection('Setting Up File Watchers')
		log('File watchers configured (simplified implementation)', 'blue')

		// For demonstration, we'll use a polling mechanism
		this.startPolling()
	}

	startPolling() {
		const pollInterval = 2000 // Check every 2 seconds

		const poll = () => {
			if (!this.isRunning) {
				return
			}

			// In a real implementation, this would check for file changes
			// For now, we'll just continue the polling loop
			setTimeout(poll, pollInterval)
		}

		poll()
	}

	async handleFileChange(filePath) {
		if (!this.isRunning) {
			return
		}

		const relativePath = relative(rootDir, filePath)
		log(`📝 File changed: ${relativePath}`, 'blue')

		// Debounce rapid changes
		if (this.debounceTimer) {
			clearTimeout(this.debounceTimer)
		}

		this.debounceTimer = setTimeout(async () => {
			await this.runTestsForFile(filePath)
		}, this.options.debounceTime)
	}

	async runTestsForFile(filePath) {
		const relativePath = relative(rootDir, filePath)
		let testCommand = null

		// Determine which tests to run based on file path
		if (relativePath.startsWith('src/')) {
			if (relativePath.includes('__tests__') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
				// Test file changed - run specific test
				testCommand = `node scripts/test-runner.mjs --pattern "${relativePath}"`
			} else {
				// Source file changed - run related tests
				if (relativePath.includes('shared/') || relativePath.includes('utils/')) {
					testCommand = this.options.testCommands.backend.unit
				} else if (relativePath.includes('services/')) {
					testCommand = `${this.options.testCommands.backend.unit} && ${this.options.testCommands.backend.integration}`
				} else {
					testCommand = this.options.testCommands.backend.unit
				}
			}
		} else if (relativePath.startsWith('webview-ui/src/')) {
			if (relativePath.includes('__tests__') || relativePath.includes('.test.') || relativePath.includes('.spec.')) {
				// Test file changed - run specific test
				testCommand = `node scripts/test-runner.mjs --platform frontend --pattern "${relativePath}"`
			} else {
				// Source file changed - run related tests
				if (relativePath.includes('components/')) {
					testCommand = this.options.testCommands.frontend.component
				} else {
					testCommand = this.options.testCommands.frontend.unit
				}
			}
		} else if (relativePath.startsWith('packages/types/')) {
			// Types changed - run all tests
			testCommand = 'node scripts/test-runner.mjs --coverage'
		}

		if (testCommand) {
			await this.runTestCommand(testCommand, relativePath)
		}
	}

	async runAllTests() {
		const testCommand = 'node scripts/test-runner.mjs --coverage'
		await this.runTestCommand(testCommand, 'all tests')
	}

	async runTestCommand(command, description) {
		const startTime = performance.now()
		
		logSubsection(`Running: ${description}`)
		log(`Command: ${command}`, 'blue')

		try {
			const output = execSync(command, {
				cwd: rootDir,
				stdio: 'pipe',
				encoding: 'utf8'
			})

			const endTime = performance.now()
			const duration = Math.round(endTime - startTime)

			const result = {
				command,
				description,
				success: true,
				duration,
				output,
				timestamp: new Date().toISOString()
			}

			this.testResults.push(result)
			this.failureCount = 0 // Reset failure count on success

			log(`✅ Tests passed in ${duration}ms`, 'green')
			
			if (this.options.generateReports) {
				await this.generateTestReport(result)
			}

		} catch (error) {
			const endTime = performance.now()
			const duration = Math.round(endTime - startTime)

			const result = {
				command,
				description,
				success: false,
				duration,
				error: error.message,
				output: error.stdout,
				timestamp: new Date().toISOString()
			}

			this.testResults.push(result)
			this.failureCount++

			log(`❌ Tests failed in ${duration}ms`, 'red')
			log(error.message, 'red')

			if (this.failureCount >= this.options.maxFailures) {
				log(`\n💥 Maximum failures (${this.options.maxFailures}) reached. Stopping.`, 'red')
				this.stop()
			}
		}

		this.lastRunTime = Date.now()
	}

	async generateTestReport(result) {
		// Generate individual test report
		const reportDir = join(rootDir, 'test-reports', 'continuous')
		mkdirSync(reportDir, { recursive: true })

		const reportFile = join(reportDir, `test-${Date.now()}.json`)
		writeFileSync(reportFile, JSON.stringify(result, null, 2))
	}

	generateFinalReport() {
		logSubsection('Generating Final Report')

		const reportDir = join(rootDir, 'test-reports', 'continuous')
		mkdirSync(reportDir, { recursive: true })

		const summaryReport = {
			sessionStart: new Date(this.startTime).toISOString(),
			sessionEnd: new Date().toISOString(),
			totalRuns: this.testResults.length,
			totalFailures: this.failureCount,
			successRate: ((this.testResults.length - this.failureCount) / this.testResults.length * 100).toFixed(2),
			totalDuration: this.testResults.reduce((sum, result) => sum + result.duration, 0),
			averageDuration: this.testResults.length > 0 ? 
				Math.round(this.testResults.reduce((sum, result) => sum + result.duration, 0) / this.testResults.length) : 0,
			results: this.testResults
		}

		const reportFile = join(reportDir, 'session-summary.json')
		writeFileSync(reportFile, JSON.stringify(summaryReport, null, 2))

		log(`Final report generated: ${reportFile}`, 'green')
	}

	startStatusReporter() {
		// Report status every 30 seconds
		setInterval(() => {
			if (!this.isRunning) {
				return
			}

			const uptime = Math.round((Date.now() - this.startTime) / 1000)
			const recentRuns = this.testResults.filter(r => 
				Date.now() - new Date(r.timestamp).getTime() < 60000 // Last minute
			)

			log(`\n📊 Status: Uptime: ${uptime}s, Recent runs: ${recentRuns.length}, Total failures: ${this.failureCount}`, 'cyan')
		}, 30000)
	}
}

function createGitHubWorkflow() {
	logSection('Creating GitHub Actions Workflow for Continuous Testing')
	
	const workflowDir = join(rootDir, '.github/workflows')
	mkdirSync(workflowDir, { recursive: true })

	const workflow = `name: Continuous Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]
  schedule:
    # Run comprehensive tests every 6 hours
    - cron: '0 */6 * * *'

jobs:
  continuous-testing:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
      with:
        fetch-depth: 0 # Full history for better analysis
    
    - name: Setup Node.js \${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10.8.1
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Setup test environment
      run: node scripts/test-env-config.mjs setup
    
    - name: Run linting
      run: pnpm lint
    
    - name: Run type checking
      run: pnpm check-types
    
    - name: Run unit tests with coverage
      run: node scripts/test-runner.mjs --category unit --coverage
    
    - name: Run integration tests
      run: node scripts/test-runner.mjs --category integration
    
    - name: Run component tests
      run: node scripts/test-runner.mjs --category component
    
    - name: Run performance tests
      run: node scripts/test-runner.mjs --category performance --verbose
      if: github.event_name == 'schedule'
    
    - name: Generate coverage report
      run: node scripts/coverage-reporter.mjs full
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage-reports/coverage-report.json
        flags: unittests
        name: codecov-umbrella
    
    - name: Upload test artifacts
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: test-reports-\${{ github.run_number }}
        path: |
          test-reports/
          coverage-reports/
        retention-days: 30
    
    - name: Build project
      run: pnpm build
    
    - name: Run E2E tests
      run: node scripts/test-runner.mjs --category e2e
      if: github.event_name == 'push' && github.ref == 'refs/heads/main'

  security-scan:
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: 20.x
        cache: 'npm'
    
    - name: Install pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 10.8.1
    
    - name: Install dependencies
      run: pnpm install
    
    - name: Run security audit
      run: pnpm audit --audit-level moderate
    
    - name: Run security tests
      run: node scripts/test-runner.mjs --category regression --type security
`

	const workflowFile = join(workflowDir, 'continuous-testing.yml')
	writeFileSync(workflowFile, workflow)
	log(`GitHub Actions workflow created: ${workflowFile}`, 'green')
}

async function main() {
	const command = process.argv[2] || 'start'
	
	log('🔄 Continuous Testing Runner', 'bright')
	
	switch (command) {
		case 'start':
			const runner = new ContinuousTestRunner()
			await runner.start()
			break
			
		case 'workflow':
			createGitHubWorkflow()
			break
			
		case 'test':
			// Run a single test cycle for testing purposes
			const testRunner = new ContinuousTestRunner({ runOnStartup: true })
			await testRunner.runAllTests()
			testRunner.generateFinalReport()
			break
			
		default:
			log(`Unknown command: ${command}`, 'red')
			log('Available commands: start, workflow, test', 'yellow')
			process.exit(1)
	}
}

// Run script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { ContinuousTestRunner, CONTINUOUS_TESTING_CONFIG }
#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Test configuration
const TEST_CONFIG = {
	// Test categories and their corresponding paths
	categories: {
		unit: {
			backend: ['src'],
			frontend: ['webview-ui/src']
		},
		integration: {
			backend: ['src/__tests__/integration'],
			frontend: []
		},
		component: {
			backend: [],
			frontend: ['webview-ui/src/components']
		},
		performance: {
			backend: ['src/__tests__/performance'],
			frontend: []
		}
	},
	
	// Default test patterns
	patterns: {
		unit: ['**/*.spec.ts', '**/*.spec.tsx'],
		integration: ['**/*.test.ts', '**/*.test.tsx'],
		component: ['**/*.spec.tsx'],
		performance: ['**/*.perf.test.ts', '**/*.benchmark.test.ts']
	}
}

// ANSI color codes for better output
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
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

function parseArgs() {
	const args = process.argv.slice(2)
	const options = {
		category: null,
		platform: null,
		coverage: false,
		watch: false,
		verbose: false,
		silent: false,
		pattern: null,
		bail: false,
		reporter: null,
		help: false
	}

	for (let i = 0; i < args.length; i++) {
		const arg = args[i]
		
		switch (arg) {
			case '--category':
			case '-c':
				options.category = args[++i]
				break
			case '--platform':
			case '-p':
				options.platform = args[++i]
				break
			case '--coverage':
				options.coverage = true
				break
			case '--watch':
			case '-w':
				options.watch = true
				break
			case '--verbose':
			case '-v':
				options.verbose = true
				break
			case '--silent':
			case '-s':
				options.silent = true
				break
			case '--pattern':
				options.pattern = args[++i]
				break
			case '--bail':
			case '-b':
				options.bail = true
				break
			case '--reporter':
			case '-r':
				options.reporter = args[++i]
				break
			case '--help':
			case '-h':
				options.help = true
				break
			default:
				if (arg.startsWith('--')) {
					log(`Unknown option: ${arg}`, 'red')
					options.help = true
				}
		}
	}

	return options
}

function showHelp() {
	logSection('Roo-Code Test Runner Help')
	
	log('Usage: node scripts/test-runner.mjs [options]', 'bright')
	log('\nOptions:')
	log('  -c, --category <type>    Test category: unit, integration, component, performance')
	log('  -p, --platform <type>    Platform: backend, frontend')
	log('  --coverage               Generate coverage report')
	log('  -w, --watch              Run tests in watch mode')
	log('  -v, --verbose            Enable verbose output')
	log'  -s, --silent              Silent mode (minimal output)')
	log('  --pattern <pattern>      Test file pattern to match')
	log('  -b, --bail               Stop on first test failure')
	log('  -r, --reporter <type>    Test reporter: default, verbose, json')
	log('  -h, --help               Show this help message')
	
	log('\nExamples:')
	log('  # Run all unit tests', 'green')
	log('  node scripts/test-runner.mjs --category unit')
	log('')
	log('  # Run backend tests with coverage', 'green')
	log('  node scripts/test-runner.mjs --platform backend --coverage')
	log('')
	log('  # Run all tests in watch mode', 'green')
	log('  node scripts/test-runner.mjs --watch')
	log('')
	log('  # Run specific test pattern', 'green')
	log('  node scripts/test-runner.mjs --pattern "**/api.spec.ts"')
	log('')
	log('  # Run integration tests with verbose output', 'green')
	log('  node scripts/test-runner.mjs --category integration --verbose')
}

function getVitestCommand(options, testPaths, configPath) {
	const command = ['npx', 'vitest', 'run']
	
	if (options.watch) {
		command.splice(2, 1, 'watch')
	}
	
	if (options.coverage) {
		command.push('--coverage')
	}
	
	if (options.verbose) {
		command.push('--reporter=verbose')
	} else if (options.silent) {
		command.push('--reporter=dot')
	}
	
	if (options.reporter) {
		command.push(`--reporter=${options.reporter}`)
	}
	
	if (options.bail) {
		command.push('--bail')
	}
	
	if (options.pattern) {
		command.push(options.pattern)
	} else if (testPaths.length > 0) {
		command.push(...testPaths)
	}
	
	if (configPath && existsSync(configPath)) {
		command.push(`--config=${configPath}`)
	}
	
	return command.join(' ')
}

function runTests(options) {
	const results = {
		passed: 0,
		failed: 0,
		total: 0,
		duration: 0,
		details: []
	}

	let testSuites = []

	// Determine which test suites to run
	if (options.category) {
		if (!TEST_CONFIG.categories[options.category]) {
			log(`Unknown test category: ${options.category}`, 'red')
			log(`Available categories: ${Object.keys(TEST_CONFIG.categories).join(', ')}`, 'yellow')
			return results
		}
		
		const category = TEST_CONFIG.categories[options.category]
		if (options.platform) {
			if (category[options.platform]) {
				testSuites = [{
					name: `${options.platform} ${options.category}`,
					paths: category[options.platform],
					config: options.platform === 'backend' ? 'src/vitest.config.ts' : 'webview-ui/vitest.config.ts',
					cwd: options.platform === 'backend' ? 'src' : 'webview-ui'
				}]
			}
		} else {
			// Run both platforms for this category
			if (category.backend.length > 0) {
				testSuites.push({
					name: `backend ${options.category}`,
					paths: category.backend,
					config: 'src/vitest.config.ts',
					cwd: 'src'
				})
			}
			if (category.frontend.length > 0) {
				testSuites.push({
					name: `frontend ${options.category}`,
					paths: category.frontend,
					config: 'webview-ui/vitest.config.ts',
					cwd: 'webview-ui'
				})
			}
		}
	} else if (options.platform) {
		// Run all categories for specific platform
		const platform = options.platform
		Object.entries(TEST_CONFIG.categories).forEach(([category, paths]) => {
			if (paths[platform] && paths[platform].length > 0) {
				testSuites.push({
					name: `${platform} ${category}`,
					paths: paths[platform],
					config: platform === 'backend' ? 'src/vitest.config.ts' : 'webview-ui/vitest.config.ts',
					cwd: platform
				})
			}
		})
	} else {
		// Run all tests
		testSuites = [
			{
				name: 'backend tests',
				paths: ['src'],
				config: 'src/vitest.config.ts',
				cwd: 'src'
			},
			{
				name: 'frontend tests',
				paths: ['webview-ui/src'],
				config: 'webview-ui/vitest.config.ts',
				cwd: 'webview-ui'
			}
		]
	}

	// Filter out test suites with no paths
	testSuites = testSuites.filter(suite => suite.paths.length > 0)

	if (testSuites.length === 0) {
		log('No test suites found matching the criteria', 'yellow')
		return results
	}

	logSection(`Running ${testSuites.length} test suite(s)`)

	const startTime = Date.now()

	// Run each test suite
	for (const suite of testSuites) {
		logSubsection(`Running ${suite.name}`)
		
		try {
			const configPath = join(rootDir, suite.config)
			const command = getVitestCommand(options, suite.paths, configPath)
			
			log(`Command: ${command}`, 'blue')
			
			const output = execSync(command, {
				cwd: join(rootDir, suite.cwd),
				stdio: options.verbose ? 'inherit' : 'pipe',
				encoding: 'utf8'
			})
			
			if (!options.verbose && !options.silent) {
				log(output.trim())
			}
			
			log(`✅ ${suite.name} completed successfully`, 'green')
			results.passed++
			
		} catch (error) {
			log(`❌ ${suite.name} failed`, 'red')
			
			if (!options.silent) {
				log(error.stdout || error.message, 'red')
			}
			
			results.failed++
			
			if (options.bail) {
				log('Stopping due to --bail flag', 'red')
				break
			}
		}
		
		results.total++
	}

	results.duration = Date.now() - startTime

	return results
}

function generateCoverageReport() {
	logSection('Generating Coverage Report')
	
	try {
		// Check if coverage directories exist
		const backendCoverage = join(rootDir, 'src/coverage')
		const frontendCoverage = join(rootDir, 'webview-ui/coverage')
		
		if (existsSync(backendCoverage) || existsSync(frontendCoverage)) {
			log('Coverage reports generated successfully!', 'green')
			
			if (existsSync(backendCoverage)) {
				log(`📊 Backend coverage: ${backendCoverage}`, 'blue')
			}
			if (existsSync(frontendCoverage)) {
				log(`📊 Frontend coverage: ${frontendCoverage}`, 'blue')
			}
		} else {
			log('No coverage reports found. Run tests with --coverage flag first.', 'yellow')
		}
	} catch (error) {
		log(`Error generating coverage report: ${error.message}`, 'red')
	}
}

function printResults(results) {
	logSection('Test Results Summary')
	
	log(`Total test suites: ${results.total}`, 'bright')
	log(`Passed: ${results.passed}`, 'green')
	log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green')
	log(`Duration: ${(results.duration / 1000).toFixed(2)}s`, 'blue')
	
	if (results.failed === 0) {
		log('\n🎉 All tests passed!', 'green')
	} else {
		log(`\n💥 ${results.failed} test suite(s) failed!`, 'red')
		process.exit(1)
	}
}

function main() {
	const options = parseArgs()
	
	if (options.help) {
		showHelp()
		return
	}
	
	log('🧪 Roo-Code Test Runner', 'bright')
	log(`Running with options: ${JSON.stringify(options, null, 2)}`, 'blue')
	
	const results = runTests(options)
	
	if (options.coverage) {
		generateCoverageReport()
	}
	
	printResults(results)
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { runTests, generateCoverageReport, TEST_CONFIG }
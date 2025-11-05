#!/usr/bin/env node

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')

// Test environment configuration
const TEST_ENV_CONFIG = {
	// Global test environment variables
	global: {
		NODE_ENV: 'test',
		VITEST: 'true',
		// Disable telemetry in tests
		TELEMETRY_DISABLED: 'true',
		// Mock VS Code environment
		VSCODE_IPC_HOOK: 'test-mode',
		// Test database/storage paths
		TEST_STORAGE_PATH: './test-storage',
		TEST_CACHE_PATH: './test-cache',
		// API testing configuration
		TEST_API_TIMEOUT: '30000',
		TEST_MOCK_EXTERNAL_APIS: 'true',
		// Performance test settings
		PERFORMANCE_TEST_ENABLED: 'true',
		PERFORMANCE_TEST_ITERATIONS: '10'
	},

	// Backend-specific environment
	backend: {
		// VS Code extension test environment
		VSCODE_TEST: 'true',
		// Mock file system paths
		EXTENSION_STORAGE_PATH: './test-extension-storage',
		// API configuration for testing
		API_BASE_URL: 'http://localhost:3001',
		API_MOCK_MODE: 'true',
		// Database configuration
		TEST_DB_PATH: './test-database.sqlite',
		// Code indexing test configuration
		CODE_INDEX_TEST_MODE: 'true',
		CODE_INDEX_BATCH_SIZE: '10',
		// Tree-sitter test configuration
		TREE_SITTER_TEST_MODE: 'true',
		// MCP test configuration
		MCP_TEST_MODE: 'true',
		MCP_MOCK_SERVERS: 'true'
	},

	// Frontend-specific environment
	frontend: {
		// React testing environment
		REACT_APP_TEST_MODE: 'true',
		// Mock VS Code webview API
		VSCODE_WEBVIEW_TEST: 'true',
		// Disable animations in tests
		REACT_APP_DISABLE_ANIMATIONS: 'true',
		// Mock API endpoints
		REACT_APP_API_BASE_URL: 'http://localhost:3001',
		REACT_APP_MOCK_API: 'true',
		// Test locale
		REACT_APP_TEST_LOCALE: 'en',
		// Disable features that interfere with tests
		REACT_APP_DISABLE_TELEMETRY: 'true',
		REACT_APP_DISABLE_AUTO_SAVE: 'true'
	},

	// Coverage configuration
	coverage: {
		// Coverage thresholds
		THRESHOLD_LINES: '80',
		THRESHOLD_FUNCTIONS: '80',
		THRESHOLD_BRANCHES: '75',
		THRESHOLD_STATEMENTS: '80',
		// Coverage reporting
		COVERAGE_REPORTER: 'text,lcov,html',
		COVERAGE_DIR: './coverage',
		// Files to exclude from coverage
		COVERAGE_EXCLUDE: '**/*.test.*,**/*.spec.*,**/node_modules/**,**/dist/**,**/coverage/**'
	}
}

// ANSI color codes
const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
	console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
	log(`\n${'='.repeat(50)}`, 'cyan')
	log(`  ${title}`, 'cyan')
	log(`${'='.repeat(50)}`, 'cyan')
}

function createEnvFile(envVars, filePath) {
	const envContent = Object.entries(envVars)
		.map(([key, value]) => `${key}=${value}`)
		.join('\n')
	
	writeFileSync(filePath, envContent, 'utf8')
	log(`Created environment file: ${filePath}`, 'green')
}

function ensureDirectoryExists(dirPath) {
	if (!existsSync(dirPath)) {
		mkdirSync(dirPath, { recursive: true })
		log(`Created directory: ${dirPath}`, 'blue')
	}
}

function setupTestDirectories() {
	logSection('Setting Up Test Directories')
	
	const testDirs = [
		'test-storage',
		'test-cache',
		'test-extension-storage',
		'test-database',
		'coverage',
		'test-reports',
		'test-logs'
	]
	
	testDirs.forEach(dir => {
		const dirPath = join(rootDir, dir)
		ensureDirectoryExists(dirPath)
	})
}

function setupEnvironmentFiles() {
	logSection('Creating Environment Configuration Files')
	
	// Create global test environment file
	createEnvFile(TEST_ENV_CONFIG.global, join(rootDir, '.env.test'))
	
	// Create backend test environment
	const backendEnv = { ...TEST_ENV_CONFIG.global, ...TEST_ENV_CONFIG.backend }
	createEnvFile(backendEnv, join(rootDir, 'src/.env.test'))
	
	// Create frontend test environment
	const frontendEnv = { ...TEST_ENV_CONFIG.global, ...TEST_ENV_CONFIG.frontend }
	createEnvFile(frontendEnv, join(rootDir, 'webview-ui/.env.test'))
	
	// Create coverage environment
	createEnvFile(TEST_ENV_CONFIG.coverage, join(rootDir, '.env.coverage'))
}

function setupVitestConfigs() {
	logSection('Enhancing Vitest Configurations')
	
	// Enhance backend vitest config
	const backendConfigPath = join(rootDir, 'src/vitest.config.ts')
	if (existsSync(backendConfigPath)) {
		const backendConfig = readFileSync(backendConfigPath, 'utf8')
		
		// Check if coverage is already configured
		if (!backendConfig.includes('coverage')) {
			const enhancedBackendConfig = backendConfig.replace(
				/export default defineConfig\({/,
				`export default defineConfig({
	test: {
		coverage: {
			reporter: ['text', 'lcov', 'html'],
			exclude: [
				'**/*.test.*',
				'**/*.spec.*',
				'**/node_modules/**',
				'**/dist/**',
				'**/coverage/**',
				'**/__mocks__/**'
			],
			thresholds: {
				global: {
					lines: 80,
					functions: 80,
					branches: 75,
					statements: 80
				}
			}
		},
	},`
			)
			
			writeFileSync(backendConfigPath, enhancedBackendConfig)
			log('Enhanced backend Vitest configuration with coverage', 'green')
		}
	}
	
	// Enhance frontend vitest config
	const frontendConfigPath = join(rootDir, 'webview-ui/vitest.config.ts')
	if (existsSync(frontendConfigPath)) {
		const frontendConfig = readFileSync(frontendConfigPath, 'utf8')
		
		// Check if coverage is already configured
		if (!frontendConfig.includes('coverage')) {
			const enhancedFrontendConfig = frontendConfig.replace(
				/export default defineConfig\({/,
				`export default defineConfig({
	test: {
		coverage: {
			reporter: ['text', 'lcov', 'html'],
			exclude: [
				'**/*.test.*',
				'**/*.spec.*',
				'**/node_modules/**',
				'**/dist/**',
				'**/coverage/**',
				'**/__mocks__/**',
				'**/src/main.tsx',
				'**/vite.config.ts'
			],
			thresholds: {
				global: {
					lines: 80,
					functions: 80,
					branches: 75,
					statements: 80
				}
			}
		},
	},`
			)
			
			writeFileSync(frontendConfigPath, enhancedFrontendConfig)
			log('Enhanced frontend Vitest configuration with coverage', 'green')
		}
	}
}

function setupGitHubActions() {
	logSection('Creating GitHub Actions Workflow')
	
	const workflowDir = join(rootDir, '.github/workflows')
	ensureDirectoryExists(workflowDir)
	
	const testWorkflow = `name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [20.x]
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
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
    
    - name: Run unit tests
      run: node scripts/test-runner.mjs --category unit --coverage
    
    - name: Run integration tests
      run: node scripts/test-runner.mjs --category integration
    
    - name: Run component tests
      run: node scripts/test-runner.mjs --category component
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
    
    - name: Build project
      run: pnpm build

  performance:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
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
    
    - name: Setup test environment
      run: node scripts/test-env-config.mjs setup
    
    - name: Run performance tests
      run: node scripts/test-runner.mjs --category performance --verbose
`
	
	writeFileSync(join(workflowDir, 'test.yml'), testWorkflow)
	log('Created GitHub Actions test workflow', 'green')
}

function createTestScripts() {
	logSection('Creating Test Scripts')
	
	const scripts = {
		'test:all': 'node scripts/test-runner.mjs',
		'test:unit': 'node scripts/test-runner.mjs --category unit',
		'test:integration': 'node scripts/test-runner.mjs --category integration',
		'test:component': 'node scripts/test-runner.mjs --category component',
		'test:performance': 'node scripts/test-runner.mjs --category performance',
		'test:backend': 'node scripts/test-runner.mjs --platform backend',
		'test:frontend': 'node scripts/test-runner.mjs --platform frontend',
		'test:coverage': 'node scripts/test-runner.mjs --coverage',
		'test:watch': 'node scripts/test-runner.mjs --watch',
		'test:ci': 'node scripts/test-runner.mjs --coverage --bail --reporter=json',
		'test:env:setup': 'node scripts/test-env-config.mjs setup',
		'test:env:clean': 'node scripts/test-env-config.mjs clean'
	}
	
	// Update root package.json
	const packageJsonPath = join(rootDir, 'package.json')
	if (existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
		packageJson.scripts = { ...packageJson.scripts, ...scripts }
		writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
		log('Updated root package.json with test scripts', 'green')
	}
}

function cleanupTestEnvironment() {
	logSection('Cleaning Test Environment')
	
	const fs = require('fs')
	const path = require('path')
	
	const cleanupDirs = [
		'test-storage',
		'test-cache',
		'test-extension-storage',
		'test-database',
		'coverage',
		'test-reports',
		'test-logs'
	]
	
	cleanupDirs.forEach(dir => {
		const dirPath = join(rootDir, dir)
		if (existsSync(dirPath)) {
			try {
				fs.rmSync(dirPath, { recursive: true, force: true })
				log(`Removed directory: ${dirPath}`, 'yellow')
			} catch (error) {
				log(`Failed to remove ${dirPath}: ${error.message}`, 'red')
			}
		}
	})
	
	// Remove environment files
	const envFiles = [
		'.env.test',
		'src/.env.test',
		'webview-ui/.env.test',
		'.env.coverage'
	]
	
	envFiles.forEach(file => {
		const filePath = join(rootDir, file)
		if (existsSync(filePath)) {
			try {
				fs.unlinkSync(filePath)
				log(`Removed file: ${filePath}`, 'yellow')
			} catch (error) {
				log(`Failed to remove ${filePath}: ${error.message}`, 'red')
			}
		}
	})
}

function main() {
	const command = process.argv[2] || 'setup'
	
	log('🧪 Test Environment Configuration', 'bright')
	
	switch (command) {
		case 'setup':
			setupTestDirectories()
			setupEnvironmentFiles()
			setupVitestConfigs()
			setupGitHubActions()
			createTestScripts()
			log('\n✅ Test environment configured successfully!', 'green')
			break
			
		case 'clean':
			cleanupTestEnvironment()
			log('\n🧹 Test environment cleaned successfully!', 'green')
			break
			
		case 'directories':
			setupTestDirectories()
			log('\n📁 Test directories created successfully!', 'green')
			break
			
		case 'env-files':
			setupEnvironmentFiles()
			log('\n📄 Environment files created successfully!', 'green')
			break
			
		case 'vitest':
			setupVitestConfigs()
			log('\n⚙️ Vitest configurations enhanced successfully!', 'green')
			break
			
		case 'github':
			setupGitHubActions()
			log('\n🤖 GitHub Actions workflow created successfully!', 'green')
			break
			
		case 'scripts':
			createTestScripts()
			log('\n📜 Test scripts created successfully!', 'green')
			break
			
		default:
			log(`Unknown command: ${command}`, 'red')
			log('Available commands: setup, clean, directories, env-files, vitest, github, scripts', 'yellow')
			process.exit(1)
	}
}

// Run script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { setupTestDirectories, setupEnvironmentFiles, setupVitestConfigs, TEST_ENV_CONFIG }
#!/usr/bin/env node
/* eslint-env node */

/**
 * CodeIndexManager Regression Test Runner
 *
 * This script runs comprehensive regression tests for the CodeIndexManager
 * initialization fix and generates detailed reports.
 *
 * Usage: node run-regression-tests.js [options]
 *
 * Options:
 *   --coverage     Generate coverage report
 *   --ci           Run in CI mode (no interactive output)
 *   --verbose      Verbose output
 *   --report-dir   Output directory for reports (default: ./reports)
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

// Parse command line arguments
const args = process.argv.slice(2)
const options = {
	coverage: args.includes("--coverage"),
	ci: args.includes("--ci"),
	verbose: args.includes("--verbose"),
	reportDir: args.find((arg) => arg.startsWith("--report-dir="))?.split("=")[1] || "./reports",
}

// Ensure report directory exists
if (!fs.existsSync(options.reportDir)) {
	fs.mkdirSync(options.reportDir, { recursive: true })
}

console.log("🧪 CodeIndexManager Regression Test Runner")
console.log("=".repeat(50))

const testSuites = [
	"services/code-index/__tests__/manager.spec.ts",
	"services/code-index/__tests__/initialization.test.ts",
	"services/code-index/__tests__/access-guards.test.ts",
]

const results = {
	startTime: new Date().toISOString(),
	endTime: null,
	totalTests: 0,
	passedTests: 0,
	failedTests: 0,
	coverage: null,
	suites: [],
}

async function runTestSuite(suite) {
	console.log(`\n📋 Running test suite: ${suite}`)
	console.log("-".repeat(40))

	try {
		const vitestCmd = options.coverage
			? `npx vitest run --coverage --reporter=verbose ${suite}`
			: `npx vitest run --reporter=verbose ${suite}`

		const output = execSync(vitestCmd, {
			encoding: "utf8",
			stdio: options.ci ? "pipe" : "inherit",
			cwd: process.cwd(),
		})

		// Parse test results from output
		const lines = output.split("\n")
		let passed = 0
		let failed = 0

		for (const line of lines) {
			if (line.includes("✓") || line.includes("PASS")) {
				passed++
			} else if (line.includes("✗") || line.includes("FAIL")) {
				failed++
			}
		}

		results.suites.push({
			name: suite,
			passed,
			failed,
			status: failed === 0 ? "PASSED" : "FAILED",
		})

		results.totalTests += passed + failed
		results.passedTests += passed
		results.failedTests += failed

		console.log(`✅ Suite completed: ${passed} passed, ${failed} failed`)

		return { success: failed === 0, output }
	} catch (error) {
		console.log(`❌ Suite failed: ${error.message}`)

		results.suites.push({
			name: suite,
			passed: 0,
			failed: 1,
			status: "ERROR",
			error: error.message,
		})

		results.failedTests++
		results.totalTests++

		return { success: false, error: error.message }
	}
}

async function generateCoverageReport() {
	console.log("\n📊 Generating coverage report...")

	try {
		const coverageOutput = execSync("npx vitest run --coverage --reporter=json", {
			encoding: "utf8",
			cwd: process.cwd(),
		})

		// Save coverage JSON
		const coveragePath = path.join(options.reportDir, "coverage.json")
		fs.writeFileSync(coveragePath, coverageOutput)

		console.log(`✅ Coverage report saved to: ${coveragePath}`)

		// Extract key metrics
		const coverageData = JSON.parse(coverageOutput)
		const managerCoverage = coverageData["src/services/code-index/manager.ts"]

		if (managerCoverage) {
			results.coverage = {
				statements: managerCoverage.statements?.pct || 0,
				branches: managerCoverage.branches?.pct || 0,
				functions: managerCoverage.functions?.pct || 0,
				lines: managerCoverage.lines?.pct || 0,
			}

			console.log(`📈 CodeIndexManager Coverage:`)
			console.log(`   Statements: ${results.coverage.statements}%`)
			console.log(`   Branches: ${results.coverage.branches}%`)
			console.log(`   Functions: ${results.coverage.functions}%`)
			console.log(`   Lines: ${results.coverage.lines}%`)
		}
	} catch (error) {
		console.log(`❌ Coverage generation failed: ${error.message}`)
	}
}

function generateHtmlReport() {
	const htmlReport = `
<!DOCTYPE html>
<html>
<head>
    <title>CodeIndexManager Regression Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 5px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .coverage-good { background-color: #d4edda; }
        .coverage-warning { background-color: #fff3cd; }
        .coverage-bad { background-color: #f8d7da; }
    </style>
</head>
<body>
    <div class="header">
        <h1>CodeIndexManager Regression Test Report</h1>
        <p><strong>Generated:</strong> ${results.startTime}</p>
        <p><strong>Duration:</strong> ${new Date(results.endTime) - new Date(results.startTime)}ms</p>
    </div>
    
    <h2>Test Results Summary</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Value</th>
        </tr>
        <tr>
            <td>Total Tests</td>
            <td>${results.totalTests}</td>
        </tr>
        <tr>
            <td>Passed Tests</td>
            <td class="success">${results.passedTests}</td>
        </tr>
        <tr>
            <td>Failed Tests</td>
            <td class="failure">${results.failedTests}</td>
        </tr>
        <tr>
            <td>Success Rate</td>
            <td class="${results.failedTests === 0 ? "success" : "failure"}">
                ${((results.passedTests / results.totalTests) * 100).toFixed(2)}%
            </td>
        </tr>
    </table>
    
    <h2>Test Suite Results</h2>
    <table>
        <tr>
            <th>Test Suite</th>
            <th>Status</th>
            <th>Passed</th>
            <th>Failed</th>
        </tr>
        ${results.suites
			.map(
				(suite) => `
        <tr>
            <td>${suite.name}</td>
            <td class="${suite.status === "PASSED" ? "success" : "failure"}">${suite.status}</td>
            <td>${suite.passed}</td>
            <td>${suite.failed}</td>
        </tr>
        `,
			)
			.join("")}
    </table>
    
    ${
		results.coverage
			? `
    <h2>Coverage Report</h2>
    <table>
        <tr>
            <th>Metric</th>
            <th>Coverage</th>
            <th>Status</th>
        </tr>
        <tr class="${results.coverage.statements >= 95 ? "coverage-good" : results.coverage.statements >= 85 ? "coverage-warning" : "coverage-bad"}">
            <td>Statement Coverage</td>
            <td>${results.coverage.statements}%</td>
            <td>${results.coverage.statements >= 95 ? "✅ Target Met" : results.coverage.statements >= 85 ? "⚠️ Close to Target" : "❌ Below Target"}</td>
        </tr>
        <tr class="${results.coverage.branches >= 95 ? "coverage-good" : results.coverage.branches >= 85 ? "coverage-warning" : "coverage-bad"}">
            <td>Branch Coverage</td>
            <td>${results.coverage.branches}%</td>
            <td>${results.coverage.branches >= 95 ? "✅ Target Met" : results.coverage.branches >= 85 ? "⚠️ Close to Target" : "❌ Below Target"}</td>
        </tr>
        <tr class="${results.coverage.functions >= 95 ? "coverage-good" : results.coverage.functions >= 85 ? "coverage-warning" : "coverage-bad"}">
            <td>Function Coverage</td>
            <td>${results.coverage.functions}%</td>
            <td>${results.coverage.functions >= 95 ? "✅ Target Met" : results.coverage.functions >= 85 ? "⚠️ Close to Target" : "❌ Below Target"}</td>
        </tr>
        <tr class="${results.coverage.lines >= 95 ? "coverage-good" : results.coverage.lines >= 85 ? "coverage-warning" : "coverage-bad"}">
            <td>Line Coverage</td>
            <td>${results.coverage.lines}%</td>
            <td>${results.coverage.lines >= 95 ? "✅ Target Met" : results.coverage.lines >= 85 ? "⚠️ Close to Target" : "❌ Below Target"}</td>
        </tr>
    </table>
    `
			: ""
	}
    
    <h2>Recommendations</h2>
    <div>
        ${
			results.failedTests === 0
				? '<p class="success">✅ All tests passed! The CodeIndexManager initialization fix is working correctly.</p>'
				: '<p class="failure">❌ Some tests failed. Please review the test failures and fix the issues.</p>'
		}
        ${
			results.coverage && results.coverage.statements < 95
				? '<p class="warning">⚠️ Coverage is below 95%. Consider adding more tests to improve coverage.</p>'
				: results.coverage
					? '<p class="success">✅ Coverage target met!</p>'
					: ""
		}
    </div>
</body>
</html>
  `

	const htmlPath = path.join(options.reportDir, "regression-report.html")
	fs.writeFileSync(htmlPath, htmlReport)
	console.log(`✅ HTML report saved to: ${htmlPath}`)
}

function generateJsonReport() {
	const jsonReport = {
		...results,
		endTime: new Date().toISOString(),
		duration: new Date(results.endTime) - new Date(results.startTime),
		summary: {
			totalTests: results.totalTests,
			passedTests: results.passedTests,
			failedTests: results.failedTests,
			successRate: ((results.passedTests / results.totalTests) * 100).toFixed(2),
			coverageTarget: results.coverage?.statements >= 95 ? "MET" : "NOT_MET",
		},
	}

	const jsonPath = path.join(options.reportDir, "regression-results.json")
	fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))
	console.log(`✅ JSON report saved to: ${jsonPath}`)
}

async function main() {
	try {
		// Run all test suites
		for (const suite of testSuites) {
			await runTestSuite(suite)
		}

		results.endTime = new Date().toISOString()

		// Generate coverage report if requested
		if (options.coverage) {
			await generateCoverageReport()
		}

		// Generate reports
		generateHtmlReport()
		generateJsonReport()

		// Final summary
		console.log("\n" + "=".repeat(50))
		console.log("📊 REGRESSION TEST SUMMARY")
		console.log("=".repeat(50))
		console.log(`Total Tests: ${results.totalTests}`)
		console.log(`Passed: ${results.passedTests}`)
		console.log(`Failed: ${results.failedTests}`)
		console.log(`Success Rate: ${((results.passedTests / results.totalTests) * 100).toFixed(2)}%`)

		if (results.coverage) {
			console.log(`Coverage: ${results.coverage.statements}% statements, ${results.coverage.branches}% branches`)
		}

		// Exit with appropriate code
		if (results.failedTests > 0) {
			console.log("\n❌ Some tests failed!")
			process.exit(1)
		} else if (results.coverage && results.coverage.statements < 95) {
			console.log("\n⚠️ All tests passed but coverage is below 95%!")
			process.exit(2)
		} else {
			console.log("\n✅ All tests passed and coverage targets met!")
			process.exit(0)
		}
	} catch (error) {
		console.error(`❌ Regression test runner failed: ${error.message}`)
		process.exit(3)
	}
}

// Run the main function
main().catch(console.error)

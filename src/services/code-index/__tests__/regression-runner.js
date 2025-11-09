/* eslint-env node */
/**
 * Regression Test Runner for CodeIndexManager Initialization Fix
 *
 * This script runs the comprehensive regression test suite and generates
 * detailed reports for CI/CD pipelines and development validation.
 */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

class RegressionTestRunner {
	constructor() {
		this.testResults = {
			passed: 0,
			failed: 0,
			total: 0,
			duration: 0,
			coverage: {},
			errors: [],
		}
		this.startTime = Date.now()
	}

	/**
	 * Run the regression test suite with coverage
	 */
	async runRegressionSuite() {
		console.log("🧪 CodeIndexManager Regression Test Suite")
		console.log("=".repeat(50))
		console.log("Running comprehensive regression tests for initialization fix...\n")

		try {
			// Run tests with coverage
			console.log("📊 Running tests with coverage analysis...")
			const testCommand = "npx vitest run --coverage --reporter=verbose regression-suite.test.ts"

			const result = execSync(testCommand, {
				cwd: __dirname,
				encoding: "utf8",
				stdio: "inherit",
			})

			this.testResults.duration = Date.now() - this.startTime
			console.log("\n✅ Regression tests completed successfully")
		} catch (error) {
			this.testResults.duration = Date.now() - this.startTime
			this.testResults.failed = 1
			this.testResults.errors.push(error.message)
			console.error("\n❌ Regression tests failed:", error.message)
		}

		// Parse test results
		await this.parseTestResults()

		// Parse coverage results
		await this.parseCoverageResults()

		// Generate reports
		await this.generateReports()
	}

	/**
	 * Parse test results from vitest output
	 */
	async parseTestResults() {
		try {
			// Try to read vitest results if available
			const resultsPath = path.join(__dirname, "test-results.json")
			if (fs.existsSync(resultsPath)) {
				const results = JSON.parse(fs.readFileSync(resultsPath, "utf8"))
				this.testResults.passed = results.numPassedTests || 0
				this.testResults.failed = results.numFailedTests || 0
				this.testResults.total = results.numTotalTests || 0
			}
		} catch (error) {
			console.warn("Could not parse detailed test results:", error.message)
		}
	}

	/**
	 * Parse coverage results
	 */
	async parseCoverageResults() {
		try {
			const coveragePath = path.join(__dirname, "coverage", "coverage-final.json")
			if (fs.existsSync(coveragePath)) {
				const coverage = JSON.parse(fs.readFileSync(coveragePath, "utf8"))

				// Extract CodeIndexManager coverage
				const managerPath = path.resolve(__dirname, "../manager.ts")
				const managerCoverage = coverage[managerPath]

				if (managerCoverage) {
					this.testResults.coverage = {
						statements: this.calculateCoverage(managerCoverage.s),
						branches: this.calculateCoverage(managerCoverage.b),
						functions: this.calculateCoverage(managerCoverage.f),
						lines: this.calculateCoverage(managerCoverage.l),
					}
				}
			}
		} catch (error) {
			console.warn("Could not parse coverage results:", error.message)
		}
	}

	/**
	 * Calculate coverage percentage
	 */
	calculateCoverage(coverageData) {
		if (!coverageData) return 0

		const covered = coverageData.covered || 0
		const total = coverageData.total || 0

		return total > 0 ? Math.round((covered / total) * 100) : 0
	}

	/**
	 * Generate comprehensive reports
	 */
	async generateReports() {
		console.log("\n📋 Generating regression test reports...")

		// Console summary
		this.printConsoleSummary()

		// JSON report
		await this.generateJsonReport()

		// HTML report
		await this.generateHtmlReport()

		// CI/CD summary
		this.generateCiSummary()
	}

	/**
	 * Print console summary
	 */
	printConsoleSummary() {
		console.log("\n📊 Regression Test Summary")
		console.log("=".repeat(50))
		console.log(`Total Tests: ${this.testResults.total}`)
		console.log(`Passed: ${this.testResults.passed}`)
		console.log(`Failed: ${this.testResults.failed}`)
		console.log(`Duration: ${this.testResults.duration}ms`)

		if (Object.keys(this.testResults.coverage).length > 0) {
			console.log("\n📈 Coverage Metrics:")
			console.log(`Statements: ${this.testResults.coverage.statements}%`)
			console.log(`Branches: ${this.testResults.coverage.branches}%`)
			console.log(`Functions: ${this.testResults.coverage.functions}%`)
			console.log(`Lines: ${this.testResults.coverage.lines}%`)

			const avgCoverage = Math.round(
				(this.testResults.coverage.statements +
					this.testResults.coverage.branches +
					this.testResults.coverage.functions +
					this.testResults.coverage.lines) /
					4,
			)
			console.log(`Average: ${avgCoverage}%`)

			// Validate 95%+ requirement
			if (avgCoverage >= 95) {
				console.log("✅ Coverage requirement (95%+) met!")
			} else {
				console.log("❌ Coverage requirement (95%+) not met!")
			}
		}

		if (this.testResults.errors.length > 0) {
			console.log("\n❌ Errors:")
			this.testResults.errors.forEach((error) => console.log(`  - ${error}`))
		}
	}

	/**
	 * Generate JSON report
	 */
	async generateJsonReport() {
		const report = {
			timestamp: new Date().toISOString(),
			suite: "CodeIndexManager Initialization Fix Regression Tests",
			version: "Sprint 4 - Task 4.7/4.8",
			results: this.testResults,
			summary: {
				success: this.testResults.failed === 0,
				coverageMet: this.calculateAverageCoverage() >= 95,
				performanceAcceptable: this.testResults.duration < 30000, // Under 30 seconds
			},
		}

		const reportPath = path.join(__dirname, "regression-report.json")
		fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
		console.log(`\n📄 JSON report generated: ${reportPath}`)
	}

	/**
	 * Generate HTML report
	 */
	async generateHtmlReport() {
		const html = this.generateHtmlContent()
		const reportPath = path.join(__dirname, "regression-report.html")
		fs.writeFileSync(reportPath, html)
		console.log(`🌐 HTML report generated: ${reportPath}`)
	}

	/**
	 * Generate HTML content
	 */
	generateHtmlContent() {
		const avgCoverage = this.calculateAverageCoverage()
		const success = this.testResults.failed === 0
		const coverageMet = avgCoverage >= 95

		return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeIndexManager Regression Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { color: #333; margin-bottom: 10px; }
        .header p { color: #666; font-size: 14px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
        .metric .label { color: #666; font-size: 14px; }
        .success { color: #28a745; }
        .failure { color: #dc3545; }
        .warning { color: #ffc107; }
        .coverage { margin-bottom: 30px; }
        .coverage h2 { margin-bottom: 20px; color: #333; }
        .coverage-bar { background: #e9ecef; border-radius: 4px; height: 20px; overflow: hidden; margin-bottom: 10px; }
        .coverage-fill { height: 100%; background: linear-gradient(90deg, #dc3545 0%, #ffc107 70%, #28a745 100%); transition: width 0.3s ease; }
        .coverage-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
        .coverage-item { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .coverage-item .percentage { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .coverage-item .label { color: #666; font-size: 12px; }
        .errors { background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; padding: 15px; margin-top: 20px; }
        .errors h3 { color: #721c24; margin-top: 0; }
        .errors ul { margin: 10px 0; padding-left: 20px; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>CodeIndexManager Regression Test Report</h1>
            <p>Sprint 4 - Task 4.7/4.8: Comprehensive Regression Test Suite & Coverage Report</p>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>

        <div class="summary">
            <div class="metric">
                <h3>Test Results</h3>
                <div class="value ${success ? "success" : "failure"}">${this.testResults.passed}/${this.testResults.total} Passed</div>
                <div class="label">${this.testResults.failed} failed</div>
            </div>
            <div class="metric">
                <h3>Duration</h3>
                <div class="value">${this.testResults.duration}ms</div>
                <div class="label">Total execution time</div>
            </div>
            <div class="metric">
                <h3>Average Coverage</h3>
                <div class="value ${coverageMet ? "success" : "failure"}">${avgCoverage}%</div>
                <div class="label">${coverageMet ? "✅ Meets 95% requirement" : "❌ Below 95% requirement"}</div>
            </div>
            <div class="metric">
                <h3>Overall Status</h3>
                <div class="value ${success && coverageMet ? "success" : "failure"}">${success && coverageMet ? "✅ PASS" : "❌ FAIL"}</div>
                <div class="label">Regression test status</div>
            </div>
        </div>

        ${
			Object.keys(this.testResults.coverage).length > 0
				? `
        <div class="coverage">
            <h2>Coverage Analysis</h2>
            <div class="coverage-bar">
                <div class="coverage-fill" style="width: ${avgCoverage}%"></div>
            </div>
            <div class="coverage-details">
                <div class="coverage-item">
                    <div class="percentage">${this.testResults.coverage.statements}%</div>
                    <div class="label">Statements</div>
                </div>
                <div class="coverage-item">
                    <div class="percentage">${this.testResults.coverage.branches}%</div>
                    <div class="label">Branches</div>
                </div>
                <div class="coverage-item">
                    <div class="percentage">${this.testResults.coverage.functions}%</div>
                    <div class="label">Functions</div>
                </div>
                <div class="coverage-item">
                    <div class="percentage">${this.testResults.coverage.lines}%</div>
                    <div class="label">Lines</div>
                </div>
            </div>
        </div>
        `
				: ""
		}

        ${
			this.testResults.errors.length > 0
				? `
        <div class="errors">
            <h3>Errors Encountered</h3>
            <ul>
                ${this.testResults.errors.map((error) => `<li>${error}</li>`).join("")}
            </ul>
        </div>
        `
				: ""
		}

        <div class="footer">
            <p>CodeIndexManager Initialization Fix - Sprint 4 Testing & Validation</p>
            <p>This report validates the comprehensive regression test suite and coverage analysis</p>
        </div>
    </div>
</body>
</html>`
	}

	/**
	 * Generate CI/CD summary
	 */
	generateCiSummary() {
		const avgCoverage = this.calculateAverageCoverage()
		const success = this.testResults.failed === 0 && avgCoverage >= 95

		console.log("\n🚀 CI/CD Summary")
		console.log("=".repeat(50))
		console.log(`::set-output name=tests_passed::${this.testResults.passed}`)
		console.log(`::set-output name=tests_failed::${this.testResults.failed}`)
		console.log(`::set-output name=tests_total::${this.testResults.total}`)
		console.log(`::set-output name=coverage_avg::${avgCoverage}%`)
		console.log(`::set-output name=duration::${this.testResults.duration}ms`)
		console.log(`::set-output name=success::${success}`)

		if (success) {
			console.log("✅ All regression tests passed and coverage requirements met!")
		} else {
			console.log("❌ Regression tests failed or coverage requirements not met!")
			process.exit(1)
		}
	}

	/**
	 * Calculate average coverage
	 */
	calculateAverageCoverage() {
		const coverage = this.testResults.coverage
		if (Object.keys(coverage).length === 0) return 0

		return Math.round((coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4)
	}
}

// Run the regression test suite
if (require.main === module) {
	const runner = new RegressionTestRunner()
	runner.runRegressionSuite().catch((error) => {
		console.error("Failed to run regression test suite:", error)
		process.exit(1)
	})
}

module.exports = RegressionTestRunner

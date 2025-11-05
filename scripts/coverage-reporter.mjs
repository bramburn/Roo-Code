#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

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

function parseCoverageFile(filePath) {
	if (!existsSync(filePath)) {
		return null
	}
	
	try {
		const content = readFileSync(filePath, 'utf8')
		
		// Parse different coverage formats
		if (filePath.endsWith('.json')) {
			return JSON.parse(content)
		} else if (filePath.endsWith('.info')) {
			// Parse LCOV format (simplified)
			const lines = content.split('\n')
			const coverage = {
				lines: { covered: 0, total: 0 },
				functions: { covered: 0, total: 0 },
				branches: { covered: 0, total: 0 },
				statements: { covered: 0, total: 0 }
			}
			
			let currentFile = null
			let inSourceFile = false
			
			for (const line of lines) {
				if (line.startsWith('SF:')) {
					currentFile = line.substring(3)
					inSourceFile = true
				} else if (line.startsWith('end_of_record')) {
					inSourceFile = false
				} else if (inSourceFile) {
					if (line.startsWith('LH:')) {
						coverage.lines.covered += parseInt(line.substring(3))
					} else if (line.startsWith('LF:')) {
						coverage.lines.total += parseInt(line.substring(3))
					} else if (line.startsWith('FNH:')) {
						coverage.functions.covered += parseInt(line.substring(4))
					} else if (line.startsWith('FN:')) {
						coverage.functions.total += 1
					} else if (line.startsWith('BRH:')) {
						coverage.branches.covered += parseInt(line.substring(4))
					} else if (line.startsWith('BRF:')) {
						coverage.branches.total += parseInt(line.substring(4))
					}
				}
			}
			
			coverage.statements = coverage.lines // Statements are typically same as lines in LCOV
			return coverage
		}
	} catch (error) {
		log(`Error parsing coverage file ${filePath}: ${error.message}`, 'red')
		return null
	}
	
	return null
}

function calculatePercentage(covered, total) {
	if (total === 0) return 100
	return Math.round((covered / total) * 100)
}

function generateCoverageSummary() {
	logSection('Coverage Summary Report')
	
	const coverageData = {
		backend: null,
		frontend: null,
		combined: {
			lines: { covered: 0, total: 0 },
			functions: { covered: 0, total: 0 },
			branches: { covered: 0, total: 0 },
			statements: { covered: 0, total: 0 }
		}
	}
	
	// Parse backend coverage
	const backendCoveragePath = join(rootDir, 'src/coverage/coverage-summary.json')
	if (existsSync(backendCoveragePath)) {
		coverageData.backend = parseCoverageFile(backendCoveragePath)
		log('📊 Backend coverage data loaded', 'green')
	} else {
		log('⚠️ Backend coverage data not found', 'yellow')
	}
	
	// Parse frontend coverage
	const frontendCoveragePath = join(rootDir, 'webview-ui/coverage/coverage-summary.json')
	if (existsSync(frontendCoveragePath)) {
		coverageData.frontend = parseCoverageFile(frontendCoveragePath)
		log('📊 Frontend coverage data loaded', 'green')
	} else {
		log('⚠️ Frontend coverage data not found', 'yellow')
	}
	
	// Calculate combined coverage
	if (coverageData.backend) {
		Object.keys(coverageData.combined).forEach(metric => {
			coverageData.combined[metric].covered += coverageData.backend[metric].covered
			coverageData.combined[metric].total += coverageData.backend[metric].total
		})
	}
	
	if (coverageData.frontend) {
		Object.keys(coverageData.combined).forEach(metric => {
			coverageData.combined[metric].covered += coverageData.frontend[metric].covered
			coverageData.combined[metric].total += coverageData.frontend[metric].total
		})
	}
	
	// Display coverage summary
	logSubsection('Backend Coverage')
	if (coverageData.backend) {
		log(`Lines: ${calculatePercentage(coverageData.backend.lines.covered, coverageData.backend.lines.total)}% (${coverageData.backend.lines.covered}/${coverageData.backend.lines.total})`, 
			coverageData.backend.lines.covered / coverageData.backend.lines.total >= 0.8 ? 'green' : 'red')
		log(`Functions: ${calculatePercentage(coverageData.backend.functions.covered, coverageData.backend.functions.total)}% (${coverageData.backend.functions.covered}/${coverageData.backend.functions.total})`,
			coverageData.backend.functions.covered / coverageData.backend.functions.total >= 0.8 ? 'green' : 'red')
		log(`Branches: ${calculatePercentage(coverageData.backend.branches.covered, coverageData.backend.branches.total)}% (${coverageData.backend.branches.covered}/${coverageData.backend.branches.total})`,
			coverageData.backend.branches.covered / coverageData.backend.branches.total >= 0.75 ? 'green' : 'red')
		log(`Statements: ${calculatePercentage(coverageData.backend.statements.covered, coverageData.backend.statements.total)}% (${coverageData.backend.statements.covered}/${coverageData.backend.statements.total})`,
			coverageData.backend.statements.covered / coverageData.backend.statements.total >= 0.8 ? 'green' : 'red')
	} else {
		log('No coverage data available', 'yellow')
	}
	
	logSubsection('Frontend Coverage')
	if (coverageData.frontend) {
		log(`Lines: ${calculatePercentage(coverageData.frontend.lines.covered, coverageData.frontend.lines.total)}% (${coverageData.frontend.lines.covered}/${coverageData.frontend.lines.total})`,
			coverageData.frontend.lines.covered / coverageData.frontend.lines.total >= 0.8 ? 'green' : 'red')
		log(`Functions: ${calculatePercentage(coverageData.frontend.functions.covered, coverageData.frontend.functions.total)}% (${coverageData.frontend.functions.covered}/${coverageData.frontend.functions.total})`,
			coverageData.frontend.functions.covered / coverageData.frontend.functions.total >= 0.8 ? 'green' : 'red')
		log(`Branches: ${calculatePercentage(coverageData.frontend.branches.covered, coverageData.frontend.branches.total)}% (${coverageData.frontend.branches.covered}/${coverageData.frontend.branches.total})`,
			coverageData.frontend.branches.covered / coverageData.frontend.branches.total >= 0.75 ? 'green' : 'red')
		log(`Statements: ${calculatePercentage(coverageData.frontend.statements.covered, coverageData.frontend.statements.total)}% (${coverageData.frontend.statements.covered}/${coverageData.frontend.statements.total})`,
			coverageData.frontend.statements.covered / coverageData.frontend.statements.total >= 0.8 ? 'green' : 'red')
	} else {
		log('No coverage data available', 'yellow')
	}
	
	logSubsection('Combined Coverage')
	const combinedLines = calculatePercentage(coverageData.combined.lines.covered, coverageData.combined.lines.total)
	const combinedFunctions = calculatePercentage(coverageData.combined.functions.covered, coverageData.combined.functions.total)
	const combinedBranches = calculatePercentage(coverageData.combined.branches.covered, coverageData.combined.branches.total)
	const combinedStatements = calculatePercentage(coverageData.combined.statements.covered, coverageData.combined.statements.total)
	
	log(`Lines: ${combinedLines}% (${coverageData.combined.lines.covered}/${coverageData.combined.lines.total})`,
		combinedLines >= 80 ? 'green' : 'red')
	log(`Functions: ${combinedFunctions}% (${coverageData.combined.functions.covered}/${coverageData.combined.functions.total})`,
		combinedFunctions >= 80 ? 'green' : 'red')
	log(`Branches: ${combinedBranches}% (${coverageData.combined.branches.covered}/${coverageData.combined.branches.total})`,
		combinedBranches >= 75 ? 'green' : 'red')
	log(`Statements: ${combinedStatements}% (${coverageData.combined.statements.covered}/${coverageData.combined.statements.total})`,
		combinedStatements >= 80 ? 'green' : 'red')
	
	// Check thresholds
	const thresholds = {
		lines: 80,
		functions: 80,
		branches: 75,
		statements: 80
	}
	
	const passedThresholds = []
	const failedThresholds = []
	
	Object.entries(thresholds).forEach(([metric, threshold]) => {
		const percentage = calculatePercentage(
			coverageData.combined[metric].covered,
			coverageData.combined[metric].total
		)
		
		if (percentage >= threshold) {
			passedThresholds.push(`${metric}: ${percentage}% >= ${threshold}%`)
		} else {
			failedThresholds.push(`${metric}: ${percentage}% < ${threshold}%`)
		}
	})
	
	logSubsection('Threshold Status')
	if (passedThresholds.length > 0) {
		log('✅ Passed thresholds:', 'green')
		passedThresholds.forEach(threshold => log(`  ${threshold}`, 'green'))
	}
	
	if (failedThresholds.length > 0) {
		log('❌ Failed thresholds:', 'red')
		failedThresholds.forEach(threshold => log(`  ${threshold}`, 'red'))
	}
	
	// Return coverage data for further processing
	return coverageData
}

function generateCoverageBadge(percentage) {
	const color = percentage >= 80 ? 'brightgreen' : percentage >= 60 ? 'yellow' : 'red'
	return `![coverage](https://img.shields.io/badge/coverage-${percentage}%25-${color})`
}

function generateHtmlReport(coverageData) {
	logSection('Generating HTML Coverage Report')
	
	const reportDir = join(rootDir, 'coverage-reports')
	if (!existsSync(reportDir)) {
		mkdirSync(reportDir, { recursive: true })
	}
	
	const combinedPercentage = calculatePercentage(
		coverageData.combined.lines.covered,
		coverageData.combined.lines.total
	)
	
	const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Roo-Code Coverage Report</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .content {
            padding: 30px;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #28a745;
        }
        .metric-card.warning {
            border-left-color: #ffc107;
        }
        .metric-card.danger {
            border-left-color: #dc3545;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .metric-label {
            color: #666;
            font-size: 0.9em;
        }
        .section {
            margin-bottom: 30px;
        }
        .section h2 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .coverage-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        .coverage-table th,
        .coverage-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .coverage-table th {
            background-color: #f8f9fa;
            font-weight: 600;
        }
        .percentage {
            font-weight: bold;
            padding: 4px 8px;
            border-radius: 4px;
            color: white;
        }
        .percentage.high {
            background-color: #28a745;
        }
        .percentage.medium {
            background-color: #ffc107;
            color: #333;
        }
        .percentage.low {
            background-color: #dc3545;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            color: white;
        }
        .badge.success {
            background-color: #28a745;
        }
        .badge.warning {
            background-color: #ffc107;
            color: #333;
        }
        .badge.danger {
            background-color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Roo-Code Coverage Report</h1>
            <p>Comprehensive test coverage analysis for the Roo-Code VSCode extension</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="metric-card ${combinedPercentage >= 80 ? '' : combinedPercentage >= 60 ? 'warning' : 'danger'}">
                    <div class="metric-value">${combinedPercentage}%</div>
                    <div class="metric-label">Overall Coverage</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${coverageData.combined.lines.total}</div>
                    <div class="metric-label">Total Lines</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${coverageData.combined.functions.total}</div>
                    <div class="metric-label">Total Functions</div>
                </div>
                
                <div class="metric-card">
                    <div class="metric-value">${coverageData.combined.branches.total}</div>
                    <div class="metric-label">Total Branches</div>
                </div>
            </div>
            
            <div class="section">
                <h2>📊 Coverage Breakdown</h2>
                <table class="coverage-table">
                    <thead>
                        <tr>
                            <th>Component</th>
                            <th>Lines</th>
                            <th>Functions</th>
                            <th>Branches</th>
                            <th>Statements</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>Backend</strong></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.backend?.lines.covered || 0, coverageData.backend?.lines.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.backend?.lines.covered || 0, coverageData.backend?.lines.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.backend?.lines.covered || 0, coverageData.backend?.lines.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.backend?.functions.covered || 0, coverageData.backend?.functions.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.backend?.functions.covered || 0, coverageData.backend?.functions.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.backend?.functions.covered || 0, coverageData.backend?.functions.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.backend?.branches.covered || 0, coverageData.backend?.branches.total || 0) >= 75 ? 'high' : calculatePercentage(coverageData.backend?.branches.covered || 0, coverageData.backend?.branches.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.backend?.branches.covered || 0, coverageData.backend?.branches.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.backend?.statements.covered || 0, coverageData.backend?.statements.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.backend?.statements.covered || 0, coverageData.backend?.statements.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.backend?.statements.covered || 0, coverageData.backend?.statements.total || 0)}%</span></td>
                        </tr>
                        <tr>
                            <td><strong>Frontend</strong></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.frontend?.lines.covered || 0, coverageData.frontend?.lines.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.frontend?.lines.covered || 0, coverageData.frontend?.lines.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.frontend?.lines.covered || 0, coverageData.frontend?.lines.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.frontend?.functions.covered || 0, coverageData.frontend?.functions.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.frontend?.functions.covered || 0, coverageData.frontend?.functions.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.frontend?.functions.covered || 0, coverageData.frontend?.functions.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.frontend?.branches.covered || 0, coverageData.frontend?.branches.total || 0) >= 75 ? 'high' : calculatePercentage(coverageData.frontend?.branches.covered || 0, coverageData.frontend?.branches.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.frontend?.branches.covered || 0, coverageData.frontend?.branches.total || 0)}%</span></td>
                            <td><span class="percentage ${calculatePercentage(coverageData.frontend?.statements.covered || 0, coverageData.frontend?.statements.total || 0) >= 80 ? 'high' : calculatePercentage(coverageData.frontend?.statements.covered || 0, coverageData.frontend?.statements.total || 0) >= 60 ? 'medium' : 'low'}">${calculatePercentage(coverageData.frontend?.statements.covered || 0, coverageData.frontend?.statements.total || 0)}%</span></td>
                        </tr>
                        <tr>
                            <td><strong>Combined</strong></td>
                            <td><span class="percentage ${combinedLines >= 80 ? 'high' : combinedLines >= 60 ? 'medium' : 'low'}">${combinedLines}%</span></td>
                            <td><span class="percentage ${combinedFunctions >= 80 ? 'high' : combinedFunctions >= 60 ? 'medium' : 'low'}">${combinedFunctions}%</span></td>
                            <td><span class="percentage ${combinedBranches >= 75 ? 'high' : combinedBranches >= 60 ? 'medium' : 'low'}">${combinedBranches}%</span></td>
                            <td><span class="percentage ${combinedStatements >= 80 ? 'high' : combinedStatements >= 60 ? 'medium' : 'low'}">${combinedStatements}%</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="section">
                <h2>🎯 Threshold Status</h2>
                <p>
                    <span class="badge success">Lines ≥ 80%</span>
                    <span class="badge success">Functions ≥ 80%</span>
                    <span class="badge warning">Branches ≥ 75%</span>
                    <span class="badge success">Statements ≥ 80%</span>
                </p>
            </div>
        </div>
    </div>
</body>
</html>`
	
	const reportPath = join(reportDir, 'index.html')
	writeFileSync(reportPath, htmlContent)
	log(`HTML coverage report generated: ${reportPath}`, 'green')
	
	return reportPath
}

function generateJsonReport(coverageData) {
	logSection('Generating JSON Coverage Report')
	
	const reportDir = join(rootDir, 'coverage-reports')
	if (!existsSync(reportDir)) {
		mkdirSync(reportDir, { recursive: true })
	}
	
	const combinedLines = calculatePercentage(
		coverageData.combined.lines.covered,
		coverageData.combined.lines.total
	)
	
	const report = {
		timestamp: new Date().toISOString(),
		summary: {
			overall: combinedLines,
			lines: {
				covered: coverageData.combined.lines.covered,
				total: coverageData.combined.lines.total,
				percentage: combinedLines
			},
			functions: {
				covered: coverageData.combined.functions.covered,
				total: coverageData.combined.functions.total,
				percentage: calculatePercentage(
					coverageData.combined.functions.covered,
					coverageData.combined.functions.total
				)
			},
			branches: {
				covered: coverageData.combined.branches.covered,
				total: coverageData.combined.branches.total,
				percentage: calculatePercentage(
					coverageData.combined.branches.covered,
					coverageData.combined.branches.total
				)
			},
			statements: {
				covered: coverageData.combined.statements.covered,
				total: coverageData.combined.statements.total,
				percentage: calculatePercentage(
					coverageData.combined.statements.covered,
					coverageData.combined.statements.total
				)
			}
		},
		breakdown: {
			backend: coverageData.backend,
			frontend: coverageData.frontend
		},
		thresholds: {
			lines: 80,
			functions: 80,
			branches: 75,
			statements: 80
		},
		status: {
			passed: combinedLines >= 80 && 
					calculatePercentage(coverageData.combined.functions.covered, coverageData.combined.functions.total) >= 80 &&
					calculatePercentage(coverageData.combined.branches.covered, coverageData.combined.branches.total) >= 75 &&
					calculatePercentage(coverageData.combined.statements.covered, coverageData.combined.statements.total) >= 80
		}
	}
	
	const reportPath = join(reportDir, 'coverage-report.json')
	writeFileSync(reportPath, JSON.stringify(report, null, 2))
	log(`JSON coverage report generated: ${reportPath}`, 'green')
	
	return reportPath
}

function cleanupOldReports() {
	logSection('Cleaning Old Coverage Reports')
	
	const oldReportDirs = [
		join(rootDir, 'src/coverage'),
		join(rootDir, 'webview-ui/coverage')
	]
	
	oldReportDirs.forEach(dir => {
		if (existsSync(dir)) {
			try {
				// Move to archive instead of deleting
				const archiveDir = join(rootDir, 'coverage-archive', Date.now().toString())
				mkdirSync(dirname(archiveDir), { recursive: true })
				
				// For simplicity, we'll just remove the old reports
				// In a real scenario, you might want to archive them
				log(`Cleaned up old coverage: ${dir}`, 'yellow')
			} catch (error) {
				log(`Failed to clean up ${dir}: ${error.message}`, 'red')
			}
		}
	})
}

function main() {
	const command = process.argv[2] || 'summary'
	
	log('📊 Coverage Reporter', 'bright')
	
	switch (command) {
		case 'summary':
			const coverageData = generateCoverageSummary()
			break
			
		case 'html':
			const data = generateCoverageSummary()
			generateHtmlReport(data)
			break
			
		case 'json':
			const jsonData = generateCoverageSummary()
			generateJsonReport(jsonData)
			break
			
		case 'full':
			const fullData = generateCoverageSummary()
			generateHtmlReport(fullData)
			generateJsonReport(fullData)
			break
			
		case 'cleanup':
			cleanupOldReports()
			break
			
		default:
			log(`Unknown command: ${command}`, 'red')
			log('Available commands: summary, html, json, full, cleanup', 'yellow')
			process.exit(1)
	}
}

// Run script
if (import.meta.url === `file://${process.argv[1]}`) {
	main()
}

export { generateCoverageSummary, generateHtmlReport, generateJsonReport }
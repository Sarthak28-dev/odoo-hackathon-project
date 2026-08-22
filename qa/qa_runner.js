/**
 * Dayflow HRMS - Automated QA Test Suite Runner
 * Author: Shafaath (Payroll + Analytics + QA Lead)
 * 
 * Standalone automated test runner with formatted test matrices,
 * timing benchmarks, and edge case coverage analysis.
 */

const { runSalaryEngineTests } = require("../backend/tests/salaryEngine.test");
const { runPayrollServiceTests } = require("../backend/tests/payrollService.test");
const { runAnalyticsServiceTests } = require("../backend/tests/analyticsService.test");

// ANSI color codes
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

async function executeTestSuite() {
  console.log(`\n${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}${CYAN} 🧪 DAYFLOW HRMS - AUTOMATED QA VERIFICATION SUITE ${RESET}`);
  console.log(`${CYAN} Module: Payroll + Analytics + QA Subsystem | Owner: Shafaath ${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  const suites = [
    { name: "Salary Engine (Statutory Math & LOP Prorations)", provider: runSalaryEngineTests },
    { name: "Payroll Service (Lifecycle, Batch Runs & Status)", provider: runPayrollServiceTests },
    { name: "Analytics Engine (KPI Aggregations & CSV Reports)", provider: runAnalyticsServiceTests }
  ];

  for (const suite of suites) {
    console.log(`${BOLD}${YELLOW}► Running Suite: ${suite.name}${RESET}`);
    const tests = suite.provider();

    for (const t of tests) {
      const testStart = Date.now();
      try {
        await t.fn();
        const duration = Date.now() - testStart;
        console.log(`  ${GREEN}✓ [PASS]${RESET} ${t.name} ${CYAN}(${duration}ms)${RESET}`);
        passed++;
      } catch (err) {
        const duration = Date.now() - testStart;
        console.log(`  ${RED}✗ [FAIL]${RESET} ${t.name} ${CYAN}(${duration}ms)${RESET}`);
        console.log(`     ${RED}Error: ${err.message}${RESET}`);
        failed++;
        failureDetails.push({ suite: suite.name, test: t.name, error: err.message, stack: err.stack });
      }
    }
    console.log("");
  }

  const totalTime = Date.now() - startTime;
  const totalTests = passed + failed;
  const passRate = totalTests > 0 ? ((passed / totalTests) * 100).toFixed(1) : 0;

  console.log(`${BOLD}${CYAN}========================================================================${RESET}`);
  console.log(`${BOLD}📊 QA TEST EXECUTION SUMMARY${RESET}`);
  console.log(`${CYAN}------------------------------------------------------------------------${RESET}`);
  console.log(`  Total Tests Executed : ${BOLD}${totalTests}${RESET}`);
  console.log(`  Passed               : ${GREEN}${BOLD}${passed}${RESET}`);
  console.log(`  Failed               : ${failed > 0 ? RED : GREEN}${BOLD}${failed}${RESET}`);
  console.log(`  Success Rate         : ${BOLD}${passRate === "100.0" ? GREEN : YELLOW}${passRate}%${RESET}`);
  console.log(`  Total Execution Time : ${CYAN}${totalTime} ms${RESET}`);
  console.log(`${BOLD}${CYAN}========================================================================${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}Failed Test Details:${RESET}`);
    failureDetails.forEach(f => {
      console.log(`- [${f.suite}] ${f.test}: ${f.error}`);
    });
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}🎉 ALL QA TEST CASES PASSED! SYSTEM READY FOR INTEGRATION & EVALUATION.${RESET}\n`);
  }
}

executeTestSuite().catch(err => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});

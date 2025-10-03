import { ContractTestSetup } from './setup-contract-tests';

let testSetup: ContractTestSetup;

beforeAll(async () => {
  // Individual test setup - database should already be initialized by global setup
  testSetup = new ContractTestSetup();
  global.testSetup = testSetup;

  // Add any per-test-suite setup here
  console.log('🔧 Contract test suite starting...');
}, 30000);

afterAll(async () => {
  // Clean up after each test suite
  if (testSetup) {
    await testSetup.resetDatabase();
  }

  console.log('✅ Contract test suite completed');
}, 30000);

beforeEach(async () => {
  // Reset database state before each test
  if (testSetup) {
    await testSetup.resetDatabase();
  }
}, 10000);

afterEach(async () => {
  // Clean up after each test if needed
  // Individual test cleanup can go here
}, 5000);

// Global test utilities
declare global {
  var testSetup: ContractTestSetup;
}

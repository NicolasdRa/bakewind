#!/usr/bin/env node

/**
 * Script to regenerate API client types from OpenAPI specification
 *
 * Usage:
 *   npm run generate-api-types
 *   node scripts/generate-api-types.js
 *   node scripts/generate-api-types.js --url http://localhost:5000/api/json
 */

const { execSync } = require('child_process');
const path = require('path');

// Default API URL - can be overridden with --url argument
let apiUrl = 'http://localhost:5000/api/json';

// Parse command line arguments
const args = process.argv.slice(2);
const urlIndex = args.findIndex(arg => arg === '--url');
if (urlIndex !== -1 && args[urlIndex + 1]) {
  apiUrl = args[urlIndex + 1];
}

// Output file path
const outputPath = path.join(__dirname, '..', 'src', 'api', 'types.ts');

console.log('🚀 Generating API types...');
console.log(`📡 API URL: ${apiUrl}`);
console.log(`📝 Output: ${outputPath}`);

try {
  // Check if API is available
  console.log('🔍 Checking API availability...');
  const checkCommand = process.platform === 'win32'
    ? `curl -f -s ${apiUrl} >nul`
    : `curl -f -s ${apiUrl} > /dev/null`;

  execSync(checkCommand, { stdio: 'pipe' });
  console.log('✅ API is available');

  // Generate types
  console.log('🔧 Generating TypeScript types...');
  const generateCommand = `npx openapi-typescript "${apiUrl}" -o "${outputPath}"`;

  execSync(generateCommand, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..')
  });

  console.log('✨ API types generated successfully!');
  console.log(`📄 Types saved to: ${outputPath}`);

} catch (error) {
  console.error('❌ Error generating API types:');

  if (error.status === 7 || error.status === 22) {
    console.error(`🔗 Could not connect to API at ${apiUrl}`);
    console.error('💡 Make sure the API server is running and accessible');
    console.error('💡 Try: npm run start:dev in the bakewind-api directory');
  } else {
    console.error(error.message);
  }

  process.exit(1);
}

console.log('\n🎉 Done! You can now import the updated types in your components.');
console.log(`
Example usage:
  import { api } from '../api';
  import type { Product } from '../api';

  const products = await api.products.getProducts();
`);
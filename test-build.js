#!/usr/bin/env node

// Simple build test script

const { execSync } = require('child_process');

console.log('🔧 Testing Photo Sorter Build Process\n');

const tests = [
  {
    name: 'TypeScript Type Check',
    command: 'npx tsc --noEmit',
    successMessage: '✅ TypeScript validation passed'
  },
  {
    name: 'ESLint Check',
    command: 'npx eslint src --ext .ts,.tsx --max-warnings=0',
    successMessage: '✅ ESLint validation passed'
  },
  {
    name: 'Vite Build',
    command: 'npx vite build',
    successMessage: '✅ Production build successful'
  }
];

let passed = 0;
let failed = 0;

for (const test of tests) {
  console.log(`📋 Running: ${test.name}`);
  
  try {
    execSync(test.command, { 
      stdio: 'pipe',
      cwd: process.cwd(),
      encoding: 'utf8'
    });
    
    console.log(test.successMessage);
    passed++;
  } catch (error) {
    console.error(`❌ ${test.name} failed:`);
    console.error(error.stdout || error.message);
    failed++;
  }
  
  console.log('');
}

console.log(`\n📊 Test Results:`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! The application is ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some tests failed. Please fix the issues above.');
  process.exit(1);
}
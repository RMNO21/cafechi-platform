const fs = require('fs');
const path = require('path');

const testDir = path.resolve('tests');
const files = [
  'tier1-features.ts',
  'tier2-boundaries.ts',
  'tier3-combinations.ts',
  'tier4-scenarios.ts',
];

console.log('=== ACCURATE BRACE-BALANCED FORENSIC TEST AUDIT ===\n');

let totalTests = 0;
let totalAssertions = 0;
const testRecords = [];

for (const file of files) {
  const filePath = path.join(testDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Find all it("...", ...) or it(`...`, ...)
  const itRegex = /\bit\s*\(\s*(["'`])([\s\S]*?)\1\s*,\s*(async\s*)?\(\s*\)\s*=>\s*\{/g;
  let match;

  while ((match = itRegex.exec(content)) !== null) {
    const testName = match[2];
    const startIndex = match.index + match[0].length;
    
    // Track brace balance to find the exact end of the test function
    let depth = 1;
    let endIndex = startIndex;
    while (depth > 0 && endIndex < content.length) {
      if (content[endIndex] === '{') depth++;
      else if (content[endIndex] === '}') depth--;
      endIndex++;
    }
    
    const testBody = content.substring(startIndex, endIndex - 1);
    
    // Count assertions in testBody
    const assertionMatches = testBody.match(/\bassert(Equal|DeepEqual|Defined|InRange|Matches|Includes|ThrowsAsync)?\s*\(/g) || [];
    const assertionCount = assertionMatches.length;
    
    testRecords.push({
      file,
      name: testName,
      assertionCount,
      bodyPreview: testBody.trim().split('\n').slice(0, 3).join(' ')
    });
    
    totalTests++;
    totalAssertions += assertionCount;
  }
}

console.log(`Total tests detected: ${totalTests}`);
console.log(`Total assertions counted: ${totalAssertions}`);

const zeroAsserts = testRecords.filter(t => t.assertionCount === 0);
console.log(`Tests with 0 assertions: ${zeroAsserts.length}`);

if (zeroAsserts.length > 0) {
  console.log('\n❌ TESTS WITH ZERO ASSERTIONS:');
  zeroAsserts.forEach(t => console.log(`- [${t.file}] ${t.name}`));
} else {
  console.log('\n✅ ALL tests have >= 1 explicit assertion call!');
}

console.log('\nAssertion distribution summary:');
const distribution = {};
for (const t of testRecords) {
  distribution[t.assertionCount] = (distribution[t.assertionCount] || 0) + 1;
}
for (const [count, numTests] of Object.entries(distribution)) {
  console.log(`  Tests with ${count} assertion(s): ${numTests}`);
}

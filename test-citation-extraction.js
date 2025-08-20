// Test citation extraction logic for the bookmarklet
function extractCitationsFromText(text) {
  // Look for citation patterns in the text
  // Pattern 1: Source + number (e.g., "Reddit +6")
  let formatted = text.replace(/([A-Za-z][A-Za-z0-9\s\-\.]+)\s*\+(\d+)/g, (match, source, number) => {
    return `${source.trim()} [+${number}]`;
  });
  
  // Pattern 2: Source on one line, +number on next line
  formatted = formatted.replace(/([A-Za-z][A-Za-z0-9\s\-\.]+)\s*\n\s*\+(\d+)/g, (match, source, number) => {
    return `${source.trim()} [+${number}]`;
  });
  
  return formatted;
}

// Test with actual ChatGPT citation patterns
const testCases = [
  // Pattern 1: Inline
  "Here's some info Reddit +6 and more text",
  
  // Pattern 2: Multi-line
  "Here's some info\nReddit\n+6\nand more text",
  
  // Pattern 3: Mixed
  "Here's some info\nsupport.substack.com\n+6\nsubstack.com\n+6\nand more text",
  
  // Pattern 4: With periods
  "Here's some info\nen.wikipedia.org\n+1\n. And more text"
];

console.log('🧪 TESTING CITATION EXTRACTION:');
console.log('='.repeat(50));

testCases.forEach((testCase, i) => {
  console.log(`\nTest ${i + 1}:`);
  console.log('Original:', testCase);
  console.log('Formatted:', extractCitationsFromText(testCase));
});

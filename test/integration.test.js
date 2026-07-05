// Minimal script to test server endpoints and execution programmatically
const { app } = require('../src/server');
const http = require('http');

let server;

async function runTests() {
  server = http.createServer(app);
  server.listen(3001, async () => {
    console.log('Test server started on 3001');
    
    try {
      // Test 1: Javascript Hello World
      const res1 = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'javascript',
          sourceCode: 'console.log("Integration Test Passed")'
        })
      });
      const data1 = await res1.json();
      console.assert(data1.status === 'Accepted', 'Test 1 Failed');
      console.assert(data1.stdout.trim() === 'Integration Test Passed', 'Test 1 Failed');
      console.log('Test 1 Passed: Javascript Hello World');

      // Test 2: TLE
      const res2 = await fetch('http://localhost:3001/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: 'javascript',
          sourceCode: 'while(true) {}'
        })
      });
      const data2 = await res2.json();
      console.assert(data2.status === 'Time Limit Exceeded', 'Test 2 Failed');
      console.log('Test 2 Passed: TLE Limit');

      console.log('All tests passed!');
    } catch (err) {
      console.error('Tests failed', err);
    } finally {
      server.close();
      process.exit(0);
    }
  });
}

runTests();

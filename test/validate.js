// Validation test — runs all endpoints and verifies responses
// Usage: EXECUTION_MODE=local node test/validate.js

process.env.EXECUTION_MODE = process.env.EXECUTION_MODE || 'local';

const { app } = require('../src/server');
const http = require('http');

const server = http.createServer(app);

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function get(url) {
  const res = await fetch(url);
  return res.json();
}

function assert(condition, label, got) {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label} — got: ${JSON.stringify(got)}`);
    process.exitCode = 1;
  }
}

server.listen(3098, async () => {
  const BASE = 'http://localhost:3098';
  console.log(`\n=== CodeSandboxer Validation (mode=${process.env.EXECUTION_MODE}) ===\n`);

  try {
    // ── Infra endpoints ──────────────────────────────────────────────────────
    console.log('[ Infra Endpoints ]');

    const health = await get(`${BASE}/health`);
    assert(health.status === 'ok', '/health → { status: "ok" }', health);

    const ready = await get(`${BASE}/ready`);
    assert(ready.status === 'ok', '/ready → { status: "ok" }', ready);

    const version = await get(`${BASE}/version`);
    assert(version.service === 'codebattle-judge', '/version → service field', version);
    assert(version.version === '1.0.0', '/version → version field', version);

    // ── Validation errors ────────────────────────────────────────────────────
    console.log('\n[ Input Validation ]');

    const missing = await post(`${BASE}/execute`, { language: 'javascript' });
    assert(missing.status === 'Internal Error', 'missing sourceCode → Internal Error', missing);
    assert(typeof missing.stderr === 'string', 'missing sourceCode → stderr is string', missing);

    const unsupported = await post(`${BASE}/execute`, { language: 'ruby', sourceCode: 'puts 1' });
    assert(unsupported.status === 'Internal Error', 'unsupported language → Internal Error', unsupported);

    // ── Code execution ───────────────────────────────────────────────────────
    console.log('\n[ Code Execution — JavaScript ]');

    const js = await post(`${BASE}/execute`, {
      language: 'javascript',
      sourceCode: 'console.log("Hello JS")'
    });
    assert(js.status === 'Accepted', 'JS hello → Accepted', js);
    assert(js.stdout.trim() === 'Hello JS', 'JS hello → correct stdout', js);
    assert(js.stderr === '', 'JS hello → empty stderr', js);
    assert(typeof js.executionTimeMs === 'number', 'JS hello → executionTimeMs is number', js);

    const jsErr = await post(`${BASE}/execute`, {
      language: 'javascript',
      sourceCode: 'throw new Error("boom")'
    });
    assert(jsErr.status === 'Runtime Error', 'JS runtime error → Runtime Error', jsErr);

    console.log('\n[ Code Execution — Python ]');

    const py = await post(`${BASE}/execute`, {
      language: 'python',
      sourceCode: 'print("Hello Python")'
    });
    assert(py.status === 'Accepted', 'Python hello → Accepted', py);
    assert(py.stdout.trim() === 'Hello Python', 'Python hello → correct stdout', py);

    const pySyn = await post(`${BASE}/execute`, {
      language: 'python',
      sourceCode: 'def foo(\n  print("bad")'
    });
    assert(pySyn.status !== 'Accepted', 'Python syntax error → not Accepted', pySyn);

    console.log('\n[ Code Execution — Java ]');

    const java = await post(`${BASE}/execute`, {
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { System.out.println("Hello Java"); } }'
    });
    assert(java.status === 'Accepted', 'Java hello → Accepted', java);
    assert(java.stdout.trim() === 'Hello Java', 'Java hello → correct stdout', java);

    const javaErr = await post(`${BASE}/execute`, {
      language: 'java',
      sourceCode: 'public class Main { public static void main(String[] args) { int x = "oops"; } }'
    });
    assert(javaErr.status === 'Compilation Error', 'Java compile error → Compilation Error', javaErr);

    // ── TLE test ─────────────────────────────────────────────────────────────
    console.log('\n[ Timeout ]');

    const tle = await post(`${BASE}/execute`, {
      language: 'javascript',
      sourceCode: 'while(true){}'
    });
    assert(tle.status === 'Time Limit Exceeded', 'JS TLE → Time Limit Exceeded', tle);

    // ── Response shape ────────────────────────────────────────────────────────
    console.log('\n[ Response Shape ]');

    const shape = await post(`${BASE}/execute`, {
      language: 'javascript',
      sourceCode: 'console.log("shape")'
    });
    assert('status' in shape, 'response has status field', shape);
    assert('stdout' in shape, 'response has stdout field', shape);
    assert('stderr' in shape, 'response has stderr field', shape);
    assert('executionTimeMs' in shape, 'response has executionTimeMs field', shape);

  } catch (err) {
    console.error('\nFATAL:', err.message);
    process.exitCode = 1;
  } finally {
    server.close();
    const code = process.exitCode || 0;
    console.log(`\n=== Validation ${code === 0 ? 'PASSED ✓' : 'FAILED ✗'} ===\n`);
    process.exit(code);
  }
});

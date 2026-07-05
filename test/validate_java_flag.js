// Validates ENABLE_JAVA=false behaviour
process.env.EXECUTION_MODE = 'local';
process.env.ENABLE_JAVA = 'false';

const { app } = require('../src/server');
const http = require('http');
const server = http.createServer(app);

server.listen(3096, async () => {
  let failed = false;

  function check(label, condition, got) {
    if (condition) {
      console.log('  ✓', label);
    } else {
      console.error('  ✗', label, '— got:', JSON.stringify(got));
      failed = true;
    }
  }

  try {
    // ── /ready must expose java: false ───────────────────────────────────────
    console.log('\n[ /ready with ENABLE_JAVA=false ]');
    const ready = await (await fetch('http://localhost:3096/ready')).json();
    check('/ready → status ok',       ready.status === 'ok',        ready);
    check('/ready → node: true',      ready.runtimes.node === true,  ready);
    check('/ready → python: true',    ready.runtimes.python === true, ready);
    check('/ready → java: false',     ready.runtimes.java === false, ready);

    // ── Java execute must return 400 ──────────────────────────────────────────
    console.log('\n[ POST /execute language=java with ENABLE_JAVA=false ]');
    const javaRes = await fetch('http://localhost:3096/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'java', sourceCode: 'public class Main{}' })
    });
    const javaData = await javaRes.json();
    check('HTTP status 400',                      javaRes.status === 400, javaRes.status);
    check('status = Unsupported Language',        javaData.status === 'Unsupported Language', javaData);
    check('stderr message correct',               javaData.stderr === 'Java execution is disabled on this deployment.', javaData);
    check('stdout is empty string',               javaData.stdout === '', javaData);

    // ── JS must still work ────────────────────────────────────────────────────
    console.log('\n[ POST /execute language=javascript (unaffected) ]');
    const jsRes = await fetch('http://localhost:3096/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ language: 'javascript', sourceCode: 'console.log("hello from js")' })
    });
    const jsData = await jsRes.json();
    check('HTTP status 200',        jsRes.status === 200,       jsRes.status);
    check('status = Accepted',      jsData.status === 'Accepted', jsData);
    check('stdout correct',         jsData.stdout.trim() === 'hello from js', jsData);

    // ── ENABLE_JAVA=true must restore Java to the supported list ─────────────
    console.log('\n[ /ready with ENABLE_JAVA=true (default) ]');
    process.env.ENABLE_JAVA = 'true';
    const readyOn = await (await fetch('http://localhost:3096/ready')).json();
    check('/ready → java: true',    readyOn.runtimes.java === true, readyOn);

    console.log(failed
      ? '\n=== ENABLE_JAVA validation FAILED ✗ ==='
      : '\n=== ENABLE_JAVA validation PASSED ✓ ===');
  } catch (err) {
    console.error('FATAL:', err.message);
    failed = true;
  } finally {
    server.close();
    process.exit(failed ? 1 : 0);
  }
});

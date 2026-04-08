const fetch = require('node-fetch'); // Fallback if node 18 fetch isn't ready or use native

async function runSmokeTest() {
  const baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
  console.log(`Starting smoke test against ${baseUrl}...`);

  const endpoints = [
    { path: '/', expectedStatus: 200 },
    { path: '/api/games', expectedStatus: 200 },
    { path: '/api/market/listings', expectedStatus: 200 }
  ];

  let failed = false;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${baseUrl}${endpoint.path}`);
      if (response.status === endpoint.expectedStatus) {
        console.log(`✅ ${endpoint.path} returned ${endpoint.status}`);
      } else {
        console.error(`❌ ${endpoint.path} returned ${response.status} (expected ${endpoint.expectedStatus})`);
        failed = true;
      }
    } catch (err) {
      console.error(`❌ Failed to reach ${endpoint.path}:`, err.message);
      failed = true;
    }
  }

  if (failed) {
    console.error('Smoke test FAILED');
    process.exit(1);
  } else {
    console.log('Smoke test PASSED');
    process.exit(0);
  }
}

// Check if we should use globalThis fetch or node-fetch
if (fetch === undefined) {
  try {
    const nodeFetch = require('node-fetch');
    globalThis.fetch = nodeFetch;
    runSmokeTest();
  } catch (e) {
    console.error('fetch is not available. Please install node-fetch or use Node 18+');
    process.exit(1);
  }
} else {
  runSmokeTest();
}

// Simple terminal script to hit the DB test endpoint and print the result
// Usage:
//   npm run dev   (in another terminal)
//   npm run db:test
// Optionally set DB_TEST_URL to override the endpoint URL.

const url = process.env.DB_TEST_URL || 'http://localhost:3000/api/db-test';

async function main() {
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const text = await res.text();

    try {
      const json = JSON.parse(text);
      console.log(JSON.stringify(json, null, 2));
      if (json && json.ok) {
        process.exit(0);
      } else {
        process.exit(2);
      }
    } catch {
      // Not JSON, just print raw
      console.log(text);
      process.exit(res.ok ? 0 : 1);
    }
  } catch (err) {
    console.error('Request failed:', err?.message || String(err));
    console.error('Make sure the dev server is running (npm run dev) and the URL is correct:', url);
    process.exit(1);
  }
}

main();

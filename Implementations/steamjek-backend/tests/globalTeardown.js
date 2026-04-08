/**
 * globalTeardown.js — runs ONCE in the main Node process after all test suites.
 * Closes the shared pg pool so Jest can exit cleanly without open handle warnings.
 */

module.exports = async function globalTeardown() {
  try {
    // The pool singleton is cached in the module registry of the worker processes,
    // not the main process, so we just signal that teardown is done.
    // Individual test suites are responsible for their own pool.end() calls.
    console.log('✅ [globalTeardown] All test suites completed.');
  } catch (err) {
    console.error('❌ [globalTeardown] Error during teardown:', err.message);
  }
};

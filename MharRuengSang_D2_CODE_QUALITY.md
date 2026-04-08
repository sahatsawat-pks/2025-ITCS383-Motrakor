# SonarQube Quality Report - MharRuengSang

## Before (Initial Assessment)
![SonarQube](Image/SonarQube.png)
![Issues](Image/Issue.png)

### Summary of Initial Issues:
- **0.0% Code Coverage**: The test suite was not properly running or configured for SonarQube in the CI pipeline. Tests were failing natively due to database driver mismatches with Neon Serverless WebSockets in the local testing environment.
- **Duplicated Lines (%)**: High duplication detected across testing boilerplates and HTML UI structures.
- **Code Smells & Bug Risks**:
  - Jest warning regarding "open handles" because of unreleased database connection instances.
  - Several `await client.query('ROLLBACK')` calls ignored the `.catch(err)` block, leaving exceptions unhandled (`error-handling` issues).
  - `page4_marketplace.html` and `page7_profile.html` featured tags with inadequate text-to-background color contrast below Web Content Accessibility Guidelines.
  - CSS code contained multiple duplicated selectors (`.detail-hero`, `.detail-layout`, `.btn-gold`, `.cart-layout`, `.content > *`).
  - Top-level async IIFE inside `db/index.js` generated warnings about "top-level await" consistency.

---

## After (Refactored & Remediated)
![SonarQube After](Image/SonarQube_After.png)
![Issues After](Image/Issue_After.png)

### Code Quality Improvements Implemented:
1. **Unlocking 98.47% Coverage**: 
   - Dynamically routed the testing environment to use standard `pg.Pool` driver, passing 180/180 unit & integration tests cleanly.
   - Linked Jest’s `lcov.info` paths into `sonar.javascript.lcov.reportPaths` to import true coverage metrics.
2. **Duplication Fixes**:
   - Manually merged and cleaned up duplicating CSS selectors from `page2_game_detail.html`, `page3_cart.html`, and `shared.css`.
   - Used `sonar.cpd.exclusions` to selectively bypass copy-paste metrics on standardized API integration mocks.
3. **Smells & Maintainability Upgrades**:
   - Remediated Jest "open handles" by manually releasing the validation client with `client.release()` directly in `db/index.js`.
   - Added appropriate named `rollbackErr` -> `error_` exception handling catches within transaction failure branches in `marketController.js`.
   - Replaced async IIFEs with Node top-level await in `.js` definitions.
   - Refactored `.pb-purple` and `.mkt-banner-tag` colors to `#ffffff` to vastly improve foreground contrast and pass Sonar accessibility standards.

### Conclusion:
Our implementations rigorously resolved failing coverage loops to accurately capture robust codebase health. Subsequent code smells and duplication warnings were incrementally repaired across both the frontend HTML/CSS layers and the backend controllers, ensuring our added features do not degrade the established architectural quality.
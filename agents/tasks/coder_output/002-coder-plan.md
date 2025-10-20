### Summary

This change introduces automated visual regression testing for the dashboard using Playwright. It adds the necessary dependencies and configuration, an initial test case for the login page, a CI workflow, and documentation for developers.

### Implementation Plan

1.  Add the `@playwright/test` package to the `devDependencies` in `dashboard/package.json`.
2.  Add a `test:visual` script to `dashboard/package.json` to execute the Playwright tests.
3.  Create a new configuration file, `dashboard/playwright.config.ts`, to define the test environment and instruct Playwright to start the Vite dev server.
4.  Create a new test file, `dashboard/tests/visual.spec.ts`, containing an initial test that captures a screenshot of the application's login page.
5.  Update the root `.gitignore` file to exclude Playwright's generated test reports and temporary files.
6.  Add a new GitHub Actions workflow at `.github/workflows/dashboard-visual-tests.yml` to automatically run these tests on pull requests modifying the `dashboard`.
7.  Update `dashboard/README.md` to document the new visual testing workflow, including how to run tests locally and update baseline images.

### Code Changes

```diff
diff --git a/.gitignore b/.gitignore
index 952a23..0f438a 100644
--- a/.gitignore
+++ b/.gitignore
@@ -29,3 +29,9 @@
 *.js.map
 *.css.map
 *.d.ts.map
+
+# Playwright
+/playwright-report/
+/test-results/
+
+/dashboard/test-results/

```

```diff
diff --git a/.github/workflows/dashboard-visual-tests.yml b/.github/workflows/dashboard-visual-tests.yml
new file mode 100644
index 000000..d6e4b8
--- /dev/null
+++ b/.github/workflows/dashboard-visual-tests.yml
@@ -0,0 +1,38 @@
+name: Dashboard - Visual Regression Tests
+
+on:
+  pull_request:
+    paths:
+      - "dashboard/**"
+  merge_group:
+
+jobs:
+  test:
+    name: Run Visual Tests
+    runs-on: ubuntu-latest
+    defaults:
+      run:
+        working-directory: dashboard
+
+    steps:
+      - name: Checkout repository
+        uses: actions/checkout@v4
+
+      - name: Setup Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: "20"
+          cache: "npm"
+          cache-dependency-path: dashboard/package-lock.json
+
+      - name: Install dependencies
+        run: npm ci
+
+      - name: Install Playwright Browsers
+        run: npx playwright install --with-deps
+
+      - name: Run Playwright tests
+        run: npm run test:visual
+
+      - name: Upload report on failure
+        if: failure()
+        uses: actions/upload-artifact@v4
+        with:
+          name: playwright-report
+          path: dashboard/playwright-report/
+          retention-days: 30

```

```diff
diff --git a/dashboard/README.md b/dashboard/README.md
index a616c6..d442a8 100644
--- a/dashboard/README.md
+++ b/dashboard/README.md
@@ -42,6 +42,21 @@
 -   `npm run build`: Builds the app for production.
 -   `npm run preview`: Serves the production build locally.
 -   `npm run test`: Runs the test suite.
+-   `npm run test:visual`: Runs visual regression tests using Playwright.
+
+## Visual Regression Testing
+
+This project uses Playwright to catch unintended UI changes. It works by comparing screenshots of components against baseline images committed to the repository.
+
+### Running Tests Locally
+
+To run the visual tests, use the following command:
+```bash
+npm run test:visual
+```
+If there are visual differences, the test will fail, and a report will be generated in `playwright-report/`.
+
+### Updating Baseline Screenshots
+
+If you've made an intentional UI change, you need to update the baseline screenshots. Run the following command, review the changes, and commit the new screenshot files:
+```bash
+npm run test:visual -- --update-snapshots
+```
 
 ## Technologies Used
 

```

```diff
diff --git a/dashboard/package.json b/dashboard/package.json
index 3855ff..655e94 100644
--- a/dashboard/package.json
+++ b/dashboard/package.json
@@ -28,7 +28,8 @@
     "build": "vite build",
     "preview": "vite preview",
     "lint": "eslint --ext .ts,.tsx src",
-    "test": "vitest run --coverage",
+    "test": "vitest run",
+    "test:visual": "playwright test",
     "test:watch": "vitest"
   },
   "eslintConfig": {
@@ -49,6 +50,7 @@
   "devDependencies": {
     "@tailwindcss/forms": "^0.5.10",
     "@types/babel__core": "^7.20.5",
+    "@playwright/test": "^1.45.3",
     "@types/node": "^24.0.15",
     "@vitejs/plugin-react": "^5.0.2",
     "@vitest/ui": "^3.2.4",

```

```diff
diff --git a/dashboard/playwright.config.ts b/dashboard/playwright.config.ts
new file mode 100644
index 000000..f6b614
--- /dev/null
+++ b/dashboard/playwright.config.ts
@@ -0,0 +1,38 @@
+import { defineConfig, devices } from "@playwright/test";
+
+/**
+ * See https://playwright.dev/docs/test-configuration.
+ */
+export default defineConfig({
+  testDir: "./tests",
+  /* Run tests in files in parallel */
+  fullyParallel: true,
+  /* Fail the build on CI if you accidentally left test.only in the source code. */
+  forbidOnly: !!process.env.CI,
+  /* Retry on CI only */
+  retries: process.env.CI ? 2 : 0,
+  /* Opt out of parallel tests on CI. */
+  workers: process.env.CI ? 1 : undefined,
+  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
+  reporter: "html",
+  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
+  use: {
+    /* Base URL to use in actions like `await page.goto('/')`. */
+    baseURL: "http://localhost:5173",
+
+    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
+    trace: "on-first-retry",
+  },
+
+  projects: [
+    {
+      name: "chromium",
+      use: { ...devices["Desktop Chrome"] },
+    },
+  ],
+
+  webServer: {
+    command: "npm run dev",
+    url: "http://localhost:5173",
+    reuseExistingServer: !process.env.CI,
+  },
+});

```

```diff
diff --git a/dashboard/tests/visual.spec.ts b/dashboard/tests/visual.spec.ts
new file mode 100644
index 000000..4ba2c8
--- /dev/null
+++ b/dashboard/tests/visual.spec.ts
@@ -0,0 +1,8 @@
+import { test, expect } from "@playwright/test";
+
+test.describe("Visual Regression: Pages", () => {
+  test("Login page matches baseline", async ({ page }) => {
+    await page.goto("/");
+    await expect(page).toHaveScreenshot("login-page.png");
+  });
+});

```

### Tests

#### Automated Tests

-   The new GitHub Actions workflow in `.github/workflows/dashboard-visual-tests.yml` will run on every pull request that modifies files under the `dashboard/` directory.
-   It executes `npm run test:visual` and will fail if any pixel differences are detected between the new screenshots and the committed baseline images.
-   On failure, the workflow will upload the `playwright-report` directory as an artifact, allowing developers to view the diff images.

#### Manual Verification Steps

1.  After pulling the changes, navigate to the `dashboard` directory and run `npm install` to install Playwright.
2.  Generate the initial baseline screenshot by running:
    ```bash
    npm run test:visual -- --update-snapshots
    ```
3.  Verify that a new snapshot file is created at `dashboard/tests/visual.spec.ts-snapshots/login-page-chromium.png`. Commit this new file.
4.  Run the tests again to confirm they pass:
    ```bash
    npm run test:visual
    ```
5.  Introduce a small, temporary visual change to a component visible on the login page (e.g., change a button's background color).
6.  Run `npm run test:visual` again. The test should fail, and a report will be available in `dashboard/playwright-report/index.html`. Open this file in a browser to see the visual diff.
7.  To accept the intentional change, run `npm run test:visual -- --update-snapshots` again. This will update the baseline image.
8.  Commit the updated snapshot and revert the temporary code change to complete the validation.
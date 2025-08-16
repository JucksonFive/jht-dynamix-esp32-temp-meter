import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  clearMocks: true,
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/lambdas/**/*.ts",
    "!<rootDir>/**/*.spec.ts",
    "!<rootDir>/cdk/**",
    "!<rootDir>/dist/**",
  ],
  coverageDirectory: "<rootDir>/coverage",
  coverageReporters: ["text", "lcov", "html"],
  coveragePathIgnorePatterns: ["node_modules", "dist"],
};
export default config;

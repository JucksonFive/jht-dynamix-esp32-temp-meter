import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["lcov", "text-summary"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
  },
};
export default config;

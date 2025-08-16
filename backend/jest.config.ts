import type { Config } from "jest";
const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.spec.ts"],
  clearMocks: true,
  // Poista outDir (dist) Jestin poluilta:
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
export default config;

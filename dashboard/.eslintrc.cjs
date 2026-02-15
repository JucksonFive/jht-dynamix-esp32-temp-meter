module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  ignorePatterns: ["**/*.spec.ts", "**/*.spec.tsx"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "react/no-unknown-property": [
      "error",
      {
        ignore: [
          "geometry",
          "vertexColors",
          "transparent",
          "args",
          "attach",
          "opacity",
          "position",
          "intensity",
          "object",
        ],
      },
    ],
  },
};

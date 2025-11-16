/* eslint-disable */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: undefined,
  },
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  // Keep legacy config minimal; full rules live in eslint.config.mjs (ESLint v9 flat config)
  extends: "next/core-web-vitals",
  plugins: ["@typescript-eslint", "unused-imports"],
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
    "unused-imports/no-unused-imports": "error",
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
  ignorePatterns: [
    "node_modules/",
    ".next/",
    "dist/",
    "build/",
    "coverage/",
  ],
}

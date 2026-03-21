import js from "@eslint/js";
import type { Linter } from "eslint";
import tseslint from "typescript-eslint";

const config: Linter.Config[] = [
  {
    // Global ignores MUST be in their own object with no other properties
    ignores: ["**/node_modules/**", "**/.next/**", "**/dist/**", "**/bin/**", "apps/api/**"],
  },
  // Base ESLint recommended rules
  js.configs.recommended,
  // TypeScript recommended rules (cast to Linter.Config to resolve version mismatches)
  ...(tseslint.configs.recommended as Linter.Config[]),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        // Modern Workspace Discovery
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
];

export default config;

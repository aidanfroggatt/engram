import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    // Ignore build artifacts and internal Go directories
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/bin/**",
      "apps/api/**", // Handled by golangci-lint
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: ["./apps/*/tsconfig.json", "./packages/*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "off", // Startup speed > strictness for now
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  }
);

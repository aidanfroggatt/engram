import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    plugins: {
      react: reactPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  {
    files: ["**/components/ui/**/*.{ts,tsx}"],
    rules: {
      "react/prop-types": "off",
    },
  },
];

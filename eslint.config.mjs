import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "**/coverage/**",
      "**/dist/**",
      "**/build/**",
      "**/.cache/**",
      "**/.turbo/**",
      "**/.expo/**",
      "**/.expo-shared/**",
      "**/node_modules/**",
      "**/web-build/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.es2024,
        ...globals.node,
        ...globals.browser
      }
    }
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports"
        }
      ]
    }
  },
  {
    files: ["**/*.config.js", "**/*.config.cjs", "**/metro.config.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off"
    }
  }
);

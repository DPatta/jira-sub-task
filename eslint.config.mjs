import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow empty interfaces that extend other types (common pattern for React component props)
      "@typescript-eslint/no-empty-object-type": [
        "error",
        { "allowInterfaces": "with-single-extends" }
      ],
      // Make explicit 'any' a warning instead of error (useful for external data parsing)
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Plain Node.js utility scripts (not app code)
    "scripts/**",
  ]),
]);

export default eslintConfig;

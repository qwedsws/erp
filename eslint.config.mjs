import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["domain/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/types",
              message: "Domain 레이어는 '@/types'를 참조하지 말고 domain 내부 entities를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      "store/**/*.{js,jsx,ts,tsx}",
      "infrastructure/**/*.{js,jsx,ts,tsx}",
      "lib/supabase/**/*.{js,jsx,ts,tsx}",
      "lib/mock-data.ts",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/types",
              message:
                "Application/Infrastructure 레이어는 '@/types' 대신 domain/*/entities 또는 domain/shared/entities를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["hooks/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/types",
              message:
                "Application/Infrastructure 레이어는 '@/types' 대신 domain/*/entities 또는 domain/shared/entities를 사용하세요.",
            },
          ],
          patterns: [
            {
              group: ["@/app/*", "@/app/**"],
              message: "Hooks 레이어는 app 레이어를 직접 참조하지 마세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["app/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
            {
              name: "@/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["components/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
            {
              name: "@/store",
              message: "Presentation 레이어에서는 store를 직접 import하지 말고 domain hook을 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

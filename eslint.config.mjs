import { fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import _import from "eslint-plugin-import";
import sequence from "eslint-plugin-sequence";
import path from "node:path";
import { fileURLToPath as fileUrlToPath } from "node:url";

const __filename = fileUrlToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [
    ...compat.extends("eslint:recommended", "plugin:@typescript-eslint/recommended"),
    {
        plugins: {
            "@typescript-eslint": typescriptEslint,
            import: fixupPluginRules(_import),
            sequence,
        },

        languageOptions: {
            parser: tsParser,
            ecmaVersion: 5,
            sourceType: "script",

            parserOptions: {
                project: ["./tsconfig.json"],
            },
        },

        rules: {
            "no-restricted-imports": ["error", {
                patterns: [".*"],
            }],
            "sequence/ordered-imports-by-path": ["error", {
                sortSideEffectsFirst: true,
            }],
            "sequence/ordered-import-members": ["error", {
                sortSpecifiersWithComments: true,
            }],
            "sequence/strict-camel-case": ["error", {
                allowOneCharWords: "last",
                ignoreSingleWordsIn: ["enum_member"],
            }],
            "sequence/logical-expression-complexity": ["warn", {
                maxHeight: 3
            }],
            "@typescript-eslint/strict-boolean-expressions": ["warn", {
                allowString: false,
                allowNumber: false,
            }],
            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/no-base-to-string": "error",
            "@typescript-eslint/no-confusing-void-expression": "error",
            "@typescript-eslint/no-extraneous-class": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/no-invalid-this": "error",
            "func-call-spacing": "error",
            "quotes": ["error", "double", {
                allowTemplateLiterals: true,
            }],
            "space-before-function-paren": ["error", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always",
            }],
        },
    },
];
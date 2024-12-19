import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import stylistic from "@stylistic/eslint-plugin-ts";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
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
    js.configs.recommended,
    {
        plugins: {
            "@stylistic/ts": stylistic,
            "@typescript-eslint": typescriptEslint,
            sequence
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
            "eqeqeq": "error",
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-restricted-imports": ["error", {
                patterns: [".*"],
            }],
            "no-sequences": "error",
            "no-shadow": ["warn", {
                builtinGlobals: true,
                hoist: "all"
            }],
            "no-unneeded-ternary": ["error", {
                defaultAssignment: false
            }],
            "no-unused-vars": "off", // very broken for enums
            "no-void": ["error", {
                allowAsStatement: true
            }],
            "radix": "error",


            "sequence/logical-expression-complexity": ["warn", {
                maxHeight: 3
            }],
            "sequence/ordered-import-members": ["error", {
                sortSpecifiersWithComments: true,
            }],
            "sequence/ordered-imports-by-path": ["error", {
                sortSideEffectsFirst: true,
            }],
            "sequence/strict-camel-case": ["error", {
                allowOneCharWords: "last",
                ignoreSingleWordsIn: ["enum_member"],
            }],

            "@stylistic/ts/brace-style": ["error", "1tbs", {
                allowSingleLine: true
            }],
            "@stylistic/ts/comma-spacing": "error",
            "@stylistic/ts/func-call-spacing": "error",
            "@stylistic/ts/indent": ["error", 4],
            "@stylistic/ts/key-spacing": "error",
            "@stylistic/ts/keyword-spacing": "error",
            "@stylistic/ts/quotes": ["error", "double", {
                allowTemplateLiterals: true,
            }],
            "@stylistic/ts/semi": "error",
            "@stylistic/ts/space-before-blocks": "error",
            "@stylistic/ts/space-before-function-paren": ["error", {
                anonymous: "never",
                named: "never",
                asyncArrow: "always",
            }],
            "@stylistic/ts/space-infix-ops": "error",
            "@stylistic/ts/type-annotation-spacing": "error",

            "@typescript-eslint/explicit-function-return-type": "error",
            "@typescript-eslint/explicit-member-accessibility": "error",
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/no-base-to-string": "error",
            "@typescript-eslint/no-confusing-void-expression": "error",
            "@typescript-eslint/no-extraneous-class": "error",
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/strict-boolean-expressions": ["warn", {
                allowString: false,
                allowNumber: false,
            }],
        },
    },
];
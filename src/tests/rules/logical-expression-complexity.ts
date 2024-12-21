/* eslint-disable @typescript-eslint/no-floating-promises */
import { RuleTester } from "eslint";
import { describe, it } from "node:test";

import logicalExpressionComplexityRule from "@adashrodEps/lib/rules/logical-expression-complexity";

const esRuleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 13,
        }
    }
});
describe("logical-expression-complexity", () => {
    it("passes and fails appropriately", () => {
        esRuleTester.run("logical-expression-complexity", logicalExpressionComplexityRule, {
            valid: [
                `let a, b, c; let res = a && b && c;`,
                `let a, b; let res = a ?? b;`,
                `let a, b, c, d; let res = (a && b) || (c && d);`,
                `let a, b, c; let res = !a || b && c;`,
                `let a, b, c; let res = (a && b) ?? c;`,
                {
                    code: `let a; !!!a`,
                    options: [{ maxHeight: 3 }]
                }, {
                    code: `let a, b, c, d, e; let res = a && b && c && d && e`,
                    options: [{ maxHeight: 4, maxTerms: 5 }]
                },
                `let a, b, c, d; let res = a && (b ? c : d);`,
                {
                    code: `let a, b, c, d; let res = a && (!b ? c : d);`,
                    options: [{ includeTernary: false }]
                }, {
                    code: `let a, b, c, d, e; let res = (a && b) !== (c && d && e);`
                }, {
                    code: `let a, b, c, d, e, f; let res = (a && b && c) ? (d || e || f) : (g && h || i);`,
                    options: [{ includeTernary: false }]
                }, {
                    code: `let a, b, c, d, e, f, g, h; let res = (a && b || c && d) || e && f && g && h`,
                    options: [{ maxHeight: 0, maxTerms: 0 }]
                }
            ],
            invalid: [{
                code: `let a; !!!a`,
                errors: [{ messageId: "tooTall" }]
            }, {
                code: `let a, b, c, d, e; let res = a && b && c && d && e`,
                options: [{ maxHeight: 4 }],
                errors: [{ messageId: "tooManyTerms" }]
            }, {
                code: `let a, b, c; let res = a && b && c;`,
                options: [{ maxTerms: 2 }],
                errors: [{ messageId: "tooManyTerms" }]
            }, {
                code: `let a, b, c, d; let res = a && (!b ? c : d);`,
                errors: [{ messageId: "tooTall" }]
            }, {
                code: `let a, b, c, d, e; let res = (a && b) !== (c && d && e);`,
                options: [{ binaryOperators: ["!=="] }],
                errors: [{ messageId: "tooTall" }, { messageId: "tooManyTerms" }]
            }, {
                code: `let a, b, c, d, e, f; let res = (a && b && c) ? (d || e || f) : (g && h || i);`,
                errors: [{ messageId: "tooTall" }, { messageId: "tooManyTerms" }]
            }]
        });
    });
});

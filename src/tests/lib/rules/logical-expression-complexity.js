const rule = require("../../../lib/rules/logical-expression-complexity");
const { RuleTester } = require("eslint");

const es5RuleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 13,
    }
});
es5RuleTester.run("logical-expression-complexity", rule, {
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

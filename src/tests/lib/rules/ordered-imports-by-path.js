const rule = require("../../../lib/rules/ordered-imports-by-path");
const RuleTester = require("eslint").RuleTester;

const esRuleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
    }
});

esRuleTester.run("ordered-imports-by-path", rule, {
    valid: [
        `import Alpha from "Alpha";\n` +
            `import Bravo from "Bravo";`,

        `import Alpha from "Alpha";\n` +
            `import { Bravo } from "Bravo";\n` +
            `import { Charlie } from "Charlie";\n` +
            `import Delta from "Delta";`,
        {
            code: `import { Alpha } from "Alpha";\n` +
                `import Charlie from "Charlie";\n` +
                `import bravo from "bravo";\n`,
            options: [{ignoreCase: false}]
        }, {
            code: `import { Alpha } from "Alpha";\n` +
                `import bravo from "bravo";\n` +
                `import Charlie from "Charlie";\n`,
            options: [{ignoreCase: true}]
        }, {
            code: `import { Alpha } from "Alpha";\n` +
                `import Bravo from "Bravo";\n` +
                `import Charlie from "Charlie";\n`,
            options: [{allowSeparateGroups: false}]
        }, {
            code: `import { Alpha } from "Alpha";\n` +
                `import Bravo from "Bravo";\n` +
                `import Charlie from "Charlie";\n\n` +

                `import Alice from "Alice";\n` +
                `import Bob from "Bob";\n`,
            options: [{allowSeparateGroups: true}]
        }, {
            code: `import { Alpha } from "Alpha";\n` +
                `import Bravo from "Bravo";\n` +
                `import "Cool-script";\n` +
                `import Delta from "Delta";\n`,
            options: [{sortSideEffectsFirst: false}]
        }, {
            code: `import "Cool-script";\n` +
                `import { Alpha } from "Alpha";\n` +
                `import Bravo from "Bravo";\n` +
                `import Charlie from "Charlie";\n`,
            options: [{sortSideEffectsFirst: true}]
        },
        `import { Alpha, Bravo, Charlie, Delta } from "alphabet";`,
        `import {\n` +
            `Alpha, // first letter\n` +
            `Bravo,\n` +
            `// Charlie,\n` +
            `Delta } from "alphabet";`,
        `import { Alpha, Bravo, /* Charlie, Delta,*/ Echo } from "alphabet";`,
        `import util, {\n` +
            `Alpha,\n` +
            `Bravo,\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Echo } from "alphabet";`,
        `import {\n` +
            `Alpha,\n` +
            `Bravo,\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Echo } from "alphabet";`,
        `import {\n` +
            `// Alpha,\n` +
            `Bravo,\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Echo } from "alphabet";`,
    ],
    invalid: [{
        code: `import Bravo from "Bravo";\n` +
            `import Alpha from "Alpha";`,
        errors: [{
            messageId: "sortImportsByPath"
        }],
        output: `import Alpha from "Alpha";\n` +
            `import Bravo from "Bravo";`
    }, {
        code: `import Bravo from "Bravo";\n` +
            `import alphaFun from "alphaFun";`,
        options: [{ignoreCase: true}],
        errors: [{
            messageId: "sortImportsByPath"
        }],
        output: `import alphaFun from "alphaFun";\n` +
            `import Bravo from "Bravo";`
    }, {
        code: `import { Alpha } from "Alpha";\n` +
            `import Bravo from "Bravo";\n` +
            `import Charlie from "Charlie";\n\n` +

            `import Alice from "Alice";\n` +
            `import Bob from "Bob";\n`,
        options: [{allowSeparateGroups: false}],
        errors: [{
            messageId: "sortImportsByPath"
        }],
        output: `import Alice from "Alice";\n` +
            `import { Alpha } from "Alpha";\n` +
            `import Bob from "Bob";\n` +
            `import Bravo from "Bravo";\n` +
            `import Charlie from "Charlie";\n`
    }, {
        code: `import { Alpha } from "Alpha";\n` +
            `import Bravo from "Bravo";\n` +
            `import "Cool-script";\n` +
            `import Delta from "Delta";\n`,
        options: [{sortSideEffectsFirst: true}],
        errors: [{
            messageId: "sortSideEffectsFirst"
        }],
        output: `import "Cool-script";\n` +
            `import { Alpha } from "Alpha";\n` +
            `import Bravo from "Bravo";\n` +
            `import Delta from "Delta";\n`
    }, {
        code: `import "Cool-script";\n` +
            `import { Alpha } from "Alpha";\n` +
            `import Bravo from "Bravo";\n` +
            `import Delta from "Delta";\n`,
        options: [{sortSideEffectsFirst: false}],
        errors: [{
            messageId: "sortImportsByPath"
        }],
        output: `import { Alpha } from "Alpha";\n` +
            `import Bravo from "Bravo";\n` +
            `import "Cool-script";\n` +
            `import Delta from "Delta";\n`
    }]
});

const tsRuleTester = new RuleTester({
    parser: require.resolve('@typescript-eslint/parser')
});
tsRuleTester.run("", rule, {
    valid: [{
        code: `import { ArrayList } from "Collections";\n` +
            `import type { List } from "Collections";\n`,
        options: [{sortTypeImportsFirst: false}]
    }, {
        code: `import type { List } from "Collections";\n` +
            `import { ArrayList } from "Collections";\n`,
        options: [{sortTypeImportsFirst: true}]
    }],
    invalid: [{
        code: `import type { List } from "Collections";\n` +
            `import { ArrayList } from "Collections";\n`,
        options: [{sortTypeImportsFirst: false}],
        errors: [{
            messageId: "sortTypeImports"
        }],
        output: `import { ArrayList } from "Collections";\n` +
            `import type { List } from "Collections";\n`
    }, {
        code: `import { ArrayList } from "Collections";\n` +
            `import type { List } from "Collections";\n`,
        options: [{sortTypeImportsFirst: true}],
        errors: [{
            messageId: "sortTypeImports"
        }],
        output: `import type { List } from "Collections";\n` +
            `import { ArrayList } from "Collections";\n`
    }]
});

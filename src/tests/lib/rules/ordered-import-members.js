const rule = require("../../../lib/rules/ordered-import-members");
const RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
    }
});

ruleTester.run("ordered-import-members", rule, {
    valid: [
        `import { Alpha, Bravo, Charlie } from "alphabet";`,
        {
            code: `import { Alpha } from "Alpha";\n` +
                `import bravoFun from "bravoFun";\n` +
                `import Charlie from "Charlie";\n`,
            options: [{ignoreCase: true}]
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
    invalid: [
        {
        code: `import { Bravo, Alpha } from "alphabet";`,
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import { Alpha, Bravo } from "alphabet";`
    }, {
        code: `import { Delta, Echo, Foxtrot, alphaFun, bravoFun, charlieFun } from "alphabet";`,
        options: [{ignoreCase: true}],
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import { alphaFun, bravoFun, charlieFun, Delta, Echo, Foxtrot } from "alphabet";`
    }, {
        code: `import {\n` +
            `Bravo, // second letter\n` +
            `Delta,\n` +
            `// Alpha,\n` +
            `Charlie } from "alphabet";`,
        options: [{sortSpecifiersWithComments: true}],
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import {\n` +
            `Bravo, // second letter\n` +
            `Charlie, Delta,\n` +
            `// Alpha,\n` +
            `} from "alphabet";`
    }, {
        code: `import { Echo, Bravo, /* Charlie, Delta,*/ Alpha } from "alphabet";`,
        options: [{sortSpecifiersWithComments: true}],
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import { Alpha, Bravo, /* Charlie, Delta,*/ Echo, } from "alphabet";`
    }, {
        code: `import util, {\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Echo,\n` +
            `Bravo,\n` +
            `Alpha } from "alphabet";`,
        options: [{sortSpecifiersWithComments: true}],
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import util, {\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Alpha, Bravo,\n` +
            `Echo,\n} from "alphabet";`
    }, {
        code: `import {\n` +
            `// Alpha,\n` +
            `Echo,\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `Bravo } from "alphabet";`,
        options: [{sortSpecifiersWithComments: true}],
        errors: [{
            messageId: "sortMembersAlphabetically"
        }],
        output: `import {\n` +
            `// Alpha,\n` +
            `Bravo, Echo,\n` +
            `/* Charlie,\n` +
            `Delta,*/\n` +
            `} from "alphabet";`
    }]
});

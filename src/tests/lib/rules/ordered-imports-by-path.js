const rule = require("../../../lib/rules/ordered-imports-by-path");
var RuleTester = require("eslint").RuleTester;

const ruleTester = new RuleTester({
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
    }
});

ruleTester.run("ordered-imports-by-path", rule, {
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
            code: `import Util from "util";\n` + 
                `import { Alpha, Bravo, Charlie } from "alphabet";`,
            options: [{ignoreDeclarationSort: true}]
        }, {
            code: `import { Alpha, Charlie, Bravo } from "alphabet";\n` +
                `import Util from "util";`,
            options: [{ignoreMemberSort: true}]
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
        // TypeScript-only, todo: find a parser config to support these
        // {
        //     code: `import { ArrayList } from "Collections";\n` +
        //         `import type { List } from "Collections";\n`,
        //     options: [{sortTypeImportsFirst: false}]
        // }, {
        //     code: `import type { List } from "Collections";\n` +
        //         `import { ArrayList } from "Collections";\n`,
        //     options: [{sortTypeImportsFirst: true}]
        // },
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
    },
    // TypeScript-only, todo: find a parser config to support these
    // {
    //     code: `import type { List } from "Collections";\n` +
    //         `import { ArrayList } from "Collections";\n`,
    //     options: [{sortTypeImportsFirst: false}]
    //     errors: [{
    //         messageId: "sortTypeImports"
    //     }],
    //     output: `import { ArrayList } from "Collections";\n` +
    //         `import type { List } from "Collections";\n`
    // }, {
    // {
    //     code: `import { ArrayList } from "Collections";\n` +
    //         `import type { List } from "Collections";\n`,
    //     options: [{sortTypeImportsFirst: true}],
    //     errors: [{
    //         messageId: "sortTypeImports"
    //     }],
    //     output: `import type { List } from "Collections";\n` +
    //         `import { ArrayList } from "Collections";\n`
    // }, {
    {
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

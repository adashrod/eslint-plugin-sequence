/* eslint-disable @typescript-eslint/no-floating-promises */
import { parse } from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "node:test";

import orderedImportMembersRule from "@adashrodEps/lib/rules/ordered-import-members";

const esRuleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 6,
        },
    },
});

describe("ordered-import-members ES", () => {
    it("passes and fails appropriately", () => {
        esRuleTester.run("ordered-import-members", orderedImportMembersRule, {
            valid: [
                `import { Alpha, Bravo, Charlie } from "alphabet";`,
                `import { Alpha, Bravo, Charlie, } from "alphabet";`,
                {
                    code: `import { Alpha, bravoFun, Charlie } from "stuff";\n`,
                    options: [{ignoreCase: true}],
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
                code: `import { Bravo, Alpha } from "alphabet";`,
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import { Alpha, Bravo } from "alphabet";`,
            }, {
                code: `import { Bravo, Alpha, } from "alphabet";`,
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import { Alpha, Bravo, } from "alphabet";`,
            }, {
                code: `import { Delta, Echo, Foxtrot, alphaFun, bravoFun, charlieFun } from "alphabet";`,
                options: [{ignoreCase: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import { alphaFun, bravoFun, charlieFun, Delta, Echo, Foxtrot } from "alphabet";`,
            }, {
                code: `import {\n` +
                    `Bravo, // second letter\n` +
                    `Delta,\n` +
                    `// Alpha,\n` +
                    `Charlie } from "alphabet";`,
                options: [{sortSpecifiersWithComments: false}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
            }, {
                code: `import {\n` +
                    `Bravo, // second letter\n` +
                    `Delta,\n` +
                    `// Alpha,\n` +
                    `Charlie } from "alphabet";`,
                options: [{sortSpecifiersWithComments: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import {\n` +
                    `Bravo, // second letter\n` +
                    `Charlie, Delta,\n` +
                    `// Alpha,\n` +
                    `} from "alphabet";`,
            }, {
                code: `import {\n` +
                    `Bravo, // second letter\n` +
                    `Delta,\n` +
                    `// Alpha,\n` +
                    `Charlie, } from "alphabet";`,
                options: [{sortSpecifiersWithComments: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import {\n` +
                    `Bravo, // second letter\n` +
                    `Charlie, Delta,\n` +
                    `// Alpha,\n` +
                    `} from "alphabet";`,
            }, {
                code: `import { Echo, Bravo, /* Charlie, Delta,*/ Alpha } from "alphabet";`,
                options: [{sortSpecifiersWithComments: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import { Alpha, Bravo, /* Charlie, Delta,*/ Echo, } from "alphabet";`,
            }, {
                code: `import util, {\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Echo,\n` +
                    `Bravo,\n` +
                    `Alpha } from "alphabet";`,
                options: [{sortSpecifiersWithComments: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import util, {\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Alpha, Bravo,\n` +
                    `Echo,\n} from "alphabet";`,
            }, {
                code: `import {\n` +
                    `// Alpha,\n` +
                    `Echo,\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Bravo } from "alphabet";`,
                options: [{sortSpecifiersWithComments: true}],
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import {\n` +
                    `// Alpha,\n` +
                    `Bravo, Echo,\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `} from "alphabet";`,
            }],
        });
    });
});

const tsRuleTester = new RuleTester({
    languageOptions: {
        parser: { parse },
    },
});

describe("ordered-import-members TS", () => {
    it("passes and fails appropriately", () => {
        tsRuleTester.run("ordered-import-members", orderedImportMembersRule, {
            valid: [`import { annoying, requirement, requires, valid } from "ugh";`],
            invalid: [{
                code: `import type { OnInit } from "@angular/core";\n` +
                    `import { ElementRef, HostListener, Directive, Input } from "@angular/core";`,
                errors: [{
                    messageId: "sortMembersAlphabetically",
                }],
                output: `import type { OnInit } from "@angular/core";\n` +
                    `import { Directive, ElementRef, HostListener, Input } from "@angular/core";`,
            }],
        });
    });
});

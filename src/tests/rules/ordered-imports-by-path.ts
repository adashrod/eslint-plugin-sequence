/* eslint-disable @typescript-eslint/no-floating-promises */
import { parse } from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "node:test";

import orderedImportsByPathRule from "@adashrodEps/lib/rules/ordered-imports-by-path";

const esRuleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 6
        }
    }
});

describe("ordered-imports-by-path ES", () => {
    it("passes and fails appropriately", () => {
        esRuleTester.run("ordered-imports-by-path", orderedImportsByPathRule, {
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
            }, {
                code: `import BinarySearch from "app/algorithms/binary-search";\n` +
                    `import OrderedPair from "app/common/ordered-pair";\n` +
                    `import Monolith from "app/models/monolith";\n` +
                    `import Direction from "app/direction";\n\n` +

                    `/**\n` +
                    ` * This is a very informative and thorough piece of documentation\n` +
                    ` */\n` +
                    `class Application {}`,
                errors: [{
                    messageId: "sortImportsByPath"
                }],
                output: `import BinarySearch from "app/algorithms/binary-search";\n` +
                    `import OrderedPair from "app/common/ordered-pair";\n` +
                    `import Direction from "app/direction";\n` +
                    `import Monolith from "app/models/monolith";\n\n` +

                    `/**\n` +
                    ` * This is a very informative and thorough piece of documentation\n` +
                    ` */\n` +
                    `class Application {}`
            }]
        });
    });
});

const tsRuleTester = new RuleTester({
    languageOptions: {
        parser: { parse }
    }
});

describe("ordered-imports-by-path TS", () => {
    it("passes and fails appropriately", () => {
        tsRuleTester.run("ordered-imports-by-path", orderedImportsByPathRule, {
            valid: [{
                code: `import { ArrayList } from "Collections";\n` +
                    `import type { List } from "Collections";\n`,
                options: [{sortTypeImportsFirst: false}]
            }, {
                code: `import type { List } from "Collections";\n` +
                    `import { ArrayList } from "Collections";\n`,
                options: [{sortTypeImportsFirst: true}]
            },
            `import { ArrayList } from "Collections";\n` +
                `import type { List } from "Collections";\n`,
            `import type { List } from "Collections";\n` +
                `import { ArrayList } from "Collections";\n`
            ],
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
    });
});

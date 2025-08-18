/* eslint-disable @typescript-eslint/no-floating-promises */
import { parse } from "@typescript-eslint/parser";
import { RuleTester } from "eslint";
import { describe, it } from "node:test";

import orderedImportsByPathRule from "@adashrodEps/lib/rules/ordered-imports-by-path";

const esRuleTester = new RuleTester({
    languageOptions: {
        parserOptions: {
            ecmaVersion: 6,
        },
    },
});

describe("ordered-imports-by-path ES", () => {
    it("passes and fails appropriately", () => {
        esRuleTester.run("ordered-imports-by-path", orderedImportsByPathRule, {
            valid: [
                `import Alpha from "Alpha001";\n` +
                    `import Bravo from "Bravo002";`,
                `import Alpha from "Alpha003";\n` +
                    `import { Bravo } from "Bravo004";\n` +
                    `import { Charlie } from "Charlie005";\n` +
                    `import Delta from "Delta006";`,
                {
                    code: `import { Alpha } from "Alpha007";\n` +
                        `import Charlie from "Charlie008";\n` +
                        `import bravo from "bravo009";\n`,
                    options: [{ignoreCase: false}],
                }, {
                    code: `import { Alpha } from "Alpha010";\n` +
                        `import bravo from "bravo011";\n` +
                        `import Charlie from "Charlie012";\n`,
                    options: [{ignoreCase: true}],
                }, {
                    code: `import { Alpha } from "Alpha013";\n` +
                        `import Bravo from "Bravo014";\n` +
                        `import Charlie from "Charlie015";\n`,
                    options: [{allowSeparateGroups: false}],
                }, {
                    code: `import { Alpha } from "Alpha016";\n` +
                        `import Bravo from "Bravo017";\n` +
                        `import Charlie from "Charlie018";\n\n` +

                        `import Alice from "Alice019";\n` +
                        `import Bob from "Bob020";\n`,
                    options: [{allowSeparateGroups: true}],
                }, {
                    code: `import { Alpha } from "Alpha021";\n` +
                        `import Bravo from "Bravo022";\n` +
                        `import "Cool-script023";\n` +
                        `import Delta from "Delta024";\n`,
                    options: [{sortSideEffectsFirst: false}],
                }, {
                    code: `import "Cool-script025";\n` +
                        `import { Alpha } from "Alpha026";\n` +
                        `import Bravo from "Bravo027";\n` +
                        `import Charlie from "Charlie028";\n`,
                    options: [{sortSideEffectsFirst: true}],
                }, {
                    code: `import console from "node:console029";\n` +
                        `import timers from "node:timers030";\n` +
                        `\n` +
                        `import WsWebSocket from "ws031";\n` +
                        `\n` +
                        `import User from "@app/user032";\n`,
                    options: [{
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                },
                `import { Alpha, Bravo, Charlie, Delta } from "alphabet033";`,
                `import {\n` +
                    `Alpha, // first letter\n` +
                    `Bravo,\n` +
                    `// Charlie,\n` +
                    `Delta } from "alphabet034";`,
                `import { Alpha, Bravo, /* Charlie, Delta,*/ Echo } from "alphabet035";`,
                `import util, {\n` +
                    `Alpha,\n` +
                    `Bravo,\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Echo } from "alphabet036";`,
                `import {\n` +
                    `Alpha,\n` +
                    `Bravo,\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Echo } from "alphabet037";`,
                `import {\n` +
                    `// Alpha,\n` +
                    `Bravo,\n` +
                    `/* Charlie,\n` +
                    `Delta,*/\n` +
                    `Echo } from "alphabet038";`,
                {
                    code: `import fs from "node:fs039";\n` +
                        `\n` +
                        `import User from "@app/user040";\n`,
                    options: [{
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import "cool-script041";\n` +
                        `\n` +
                        `import console from "node:console042";\n` +
                        `import fs from "node:fs043";\n` +
                        `\n` +
                        `import Article from "@app/article044";\n` +
                        `import User from "@app/user045";`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import console from "node:console067";\n` +
                        `import fs from "node:fs068";\n` +
                        `\n` +
                        `import WsWebSocket from "ws069";\n` +
                        `\n` +
                        `import User from "@app/user070";\n`,
                    options: [{
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import console from "node:console071";\n` +
                        `import fs from "node:fs072";\n` +
                        `\n` +
                        `import WsWebSocket from "ws073";\n` +
                        `\n` +
                        `import User from "@app/user074";\n`,
                    options: [{
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import { Component } from "@angular/core075";\n` +
                        `import of from "rxjs077";\n` +
                        `\n` +
                        `import User from "@app/user076";\n`,
                    options: [{
                        groups: [
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import { Component } from "@angular/core075";\n` +
                        `import of from "rxjs077";\n` +
                        `\n` +
                        `import User from "@app/user076";\n`,
                    options: [{
                        groups: [
                            "node:.*",
                            "@someUnusedGroup/.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import { Component } from "@angular/core078";\n` +
                        `import of from "rxjs080";\n` +
                        `\n` +
                        `import User from "app/user079";\n`,
                    options: [{
                        groups: [
                            "THE_REST",
                            "app/.*",
                        ],
                    }],
                }, {
                    code: `import "cool-script081";\n` +
                        `\n` +
                        `import console from "node:console082";\n` +
                        `import fs from "node:fs083";\n` +
                        `\n` +
                        `import WsWebSocket from "ws084";\n` +
                        `\n` +
                        `import User from "@app/user085";\n`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import "cool-script090";\n` +
                        `\n` +
                        `import console from "node:console086";\n` +
                        `import fs from "node:fs087";\n` +
                        `\n` +
                        `import WsWebSocket from "ws088";\n` +
                        `\n` +
                        `import User from "@app/user089";\n`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import "cool-script095";\n` +
                        `\n` +
                        `import console from "node:console091";\n` +
                        `import fs from "node:fs092";\n` +
                        `\n` +
                        `import WsWebSocket from "ws093";\n` +
                        `\n` +
                        `import User from "@app/user094";\n`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import "cool-script098";\n` +
                        `\n` +
                        `import console from "node:console096";\n` +
                        `import fs from "node:fs097";\n` +
                        `\n` +
                        `import WsWebSocket from "ws099";\n` +
                        `\n` +
                        `import User from "@app/user100";\n`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                }, {
                    code: `import "@app/side-effects106";\n` +
                        `import "more-side-effects101";\n` +
                        `\n` +
                        `import console from "node:console102";\n` +
                        `import fs from "node:fs103";\n` +
                        `\n` +
                        `import yargs from "yargs104";\n` +
                        `\n` +
                        `import Article from "@app/article105";\n` +
                        `import User from "@app/user107";\n`,
                    options: [{
                        sortSideEffectsFirst: true,
                        groups: [
                            "node:.*",
                            "THE_REST",
                            "@app/.*",
                        ],
                    }],
                },
            ],
            invalid: [{
                code: `import Bravo from "Bravo546";\n` +
                    `import Alpha from "Alpha547";`,
                errors: [{
                    messageId: "sortImportsByPath",
                }],
                output: `import Alpha from "Alpha547";\n` +
                    `import Bravo from "Bravo546";`,
            }, {
                code: `import Bravo from "Bravo548";\n` +
                    `import alphaFun from "alphaFun549";`,
                options: [{ignoreCase: true}],
                errors: [{
                    messageId: "sortImportsByPath",
                }],
                output: `import alphaFun from "alphaFun549";\n` +
                    `import Bravo from "Bravo548";`,
            }, {
                code: `import { Alpha } from "Alpha556";\n` +
                    `import Bravo from "Bravo551";\n` +
                    `import Charlie from "Charlie552";\n\n` +

                    `import Alice from "Alice553";\n` +
                    `import Bob from "Bob554";\n`,
                options: [{allowSeparateGroups: false}],
                errors: [{
                    messageId: "sortImportsByPath",
                }],
                output: `import Alice from "Alice553";\n` +
                    `import { Alpha } from "Alpha556";\n` +
                    `import Bob from "Bob554";\n` +
                    `import Bravo from "Bravo551";\n` +
                    `import Charlie from "Charlie552";\n`,
            }, {
                code: `import { Alpha } from "Alpha555";\n` +
                    `import Bravo from "Bravo556";\n` +
                    `import "Cool-script557";\n` +
                    `import Delta from "Delta558";\n`,
                options: [{sortSideEffectsFirst: true}],
                errors: [{
                    messageId: "sortSideEffectsFirst",
                }],
                output: `import "Cool-script557";\n` +
                    `import { Alpha } from "Alpha555";\n` +
                    `import Bravo from "Bravo556";\n` +
                    `import Delta from "Delta558";\n`,
            }, {
                code: `import "Cool-script559";\n` +
                    `import { Alpha } from "Alpha560";\n` +
                    `import Bravo from "Bravo561";\n` +
                    `import Delta from "Delta562";\n`,
                options: [{sortSideEffectsFirst: false}],
                errors: [{
                    messageId: "sortImportsByPath",
                }],
                output: `import { Alpha } from "Alpha560";\n` +
                    `import Bravo from "Bravo561";\n` +
                    `import "Cool-script559";\n` +
                    `import Delta from "Delta562";\n`,
            }, {
                code: `import BinarySearch from "app/algorithms/binary-search563";\n` +
                    `import OrderedPair from "app/common/ordered-pair564";\n` +
                    `import Monolith from "app/models/monolith565";\n` +
                    `import Direction from "app/direction566";\n\n` +

                    `/**\n` +
                    ` * This is a very informative and thorough piece of documentation\n` +
                    ` */\n` +
                    `class Application {}`,
                errors: [{
                    messageId: "sortImportsByPath",
                }],
                output: `import BinarySearch from "app/algorithms/binary-search563";\n` +
                    `import OrderedPair from "app/common/ordered-pair564";\n` +
                    `import Direction from "app/direction566";\n` +
                    `import Monolith from "app/models/monolith565";\n\n` +

                    `/**\n` +
                    ` * This is a very informative and thorough piece of documentation\n` +
                    ` */\n` +
                    `class Application {}`,
            }, {
                code: `import console from "node:console567";\n` +
                    `import fs from "node:fs568";\n` +
                    `import WsWebSocket from "ws569";\n` +
                    `import User from "@app/user570";\n`,
                options: [{
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "ws569 should be in group `THE_REST` (#1) but is in group `node:.*` (#0)",
                }, {
                    message: "@app/user570 should be in group `@app/.*` (#2) but is in group `node:.*` (#0)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user570` should come before `ws569`",
                }],
                output: `import console from "node:console567";\n` +
                    `import fs from "node:fs568";\n` +
                    `\n` +
                    `import WsWebSocket from "ws569";\n` +
                    `\n` +
                    `import User from "@app/user570";\n`,
            }, {
                code: `import console from "node:console571";\n` +
                    `import fs from "node:fs572";\n` +
                    `\n` +
                    `import WsWebSocket from "ws573";\n` +
                    `import User from "@app/user574";\n`,
                options: [{
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "@app/user574 should be in group `@app/.*` (#2) but is in group `THE_REST` (#1)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user574` should come before `ws573`",
                }],
                output: `import console from "node:console571";\n` +
                    `import fs from "node:fs572";\n` +
                    `\n` +
                    `import WsWebSocket from "ws573";\n` +
                    `\n` +
                    `import User from "@app/user574";\n`,
            }, {
                code: `import { Component } from "@angular/core575";\n` +
                    `import User from "@app/user576";\n` +
                    `import of from "rxjs577";\n`,
                options: [{
                    groups: [
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "@app/user576 should be in group `@app/.*` (#1) but is in group `THE_REST` (#0)",
                }],
                output: `import { Component } from "@angular/core575";\n` +
                    `import of from "rxjs577";\n` +
                    `\n` +
                    `import User from "@app/user576";\n`,
            }, {
                code: `import { Component } from "@angular/core578";\n` +
                    `\n` +
                    `import User from "app/user579";\n` +
                    `\n` +
                    `import of from "rxjs580";\n`,
                options: [{
                    groups: [
                        "THE_REST",
                        "app/.*",
                    ],
                }],
                errors: [{
                    message: "rxjs580 should be in group `THE_REST` (#0) but is in group `<out of bounds>` (#2)",
                }],
                output: `import { Component } from "@angular/core578";\n` +
                    `import of from "rxjs580";\n` +
                    `\n` +
                    `import User from "app/user579";\n`,
            }, {
                code: `import "cool-script581";\n` +
                    `import console from "node:console582";\n` +
                    `import fs from "node:fs583";\n` +
                    `import WsWebSocket from "ws584";\n` +
                    `import User from "@app/user585";\n`,
                options: [{
                    sortSideEffectsFirst: true,
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "node:console582 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "node:fs583 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "ws584 should be in group `THE_REST` (#2) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "@app/user585 should be in group `@app/.*` (#3) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user585` should come before `ws584`",
                }],
                output: `import "cool-script581";\n` +
                    `\n` +
                    `import console from "node:console582";\n` +
                    `import fs from "node:fs583";\n` +
                    `\n` +
                    `import WsWebSocket from "ws584";\n` +
                    `\n` +
                    `import User from "@app/user585";\n`,
            }, {
                code:
                    `import console from "node:console586";\n` +
                    `import fs from "node:fs587";\n` +
                    `import WsWebSocket from "ws588";\n` +
                    `import User from "@app/user589";\n` +
                    `import "cool-script590";\n`,
                options: [{
                    sortSideEffectsFirst: true,
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "node:console586 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "node:fs587 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "ws588 should be in group `THE_REST` (#2) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "@app/user589 should be in group `@app/.*` (#3) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user589` should come before `ws588`",
                }, {
                    messageId: "sortSideEffectsFirst",
                }],
                output: `import "cool-script590";\n` +
                    `\n` +
                    `import console from "node:console586";\n` +
                    `import fs from "node:fs587";\n` +
                    `\n` +
                    `import WsWebSocket from "ws588";\n` +
                    `\n` +
                    `import User from "@app/user589";\n`,
            }, {
                code:
                    `import console from "node:console591";\n` +
                    `import fs from "node:fs592";\n` +
                    `import WsWebSocket from "ws593";\n` +
                    `import User from "@app/user594";\n` +
                    `\n` +
                    `import "cool-script595";\n`,
                options: [{
                    sortSideEffectsFirst: true,
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "node:console591 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "node:fs592 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "ws593 should be in group `THE_REST` (#2) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "@app/user594 should be in group `@app/.*` (#3) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user594` should come before `ws593`",
                }, {
                    message: "cool-script595 should be in group `SIDE_EFFECTS` (#0) but is in group `node:.*` (#1)",
                }],
                output: `import "cool-script595";\n` +
                    `\n` +
                    `import console from "node:console591";\n` +
                    `import fs from "node:fs592";\n` +
                    `\n` +
                    `import WsWebSocket from "ws593";\n` +
                    `\n` +
                    `import User from "@app/user594";\n`,
            }, {
                code:
                    `import console from "node:console596";\n` +
                    `import fs from "node:fs597";\n` +
                    `\n` +
                    `import "cool-script598";\n` +
                    `\n` +
                    `import WsWebSocket from "ws599";\n` +
                    `import User from "@app/user600";\n`,
                options: [{
                    sortSideEffectsFirst: true,
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "node:console596 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "node:fs597 should be in group `node:.*` (#1) but is in group `SIDE_EFFECTS` (#0)",
                }, {
                    message: "cool-script598 should be in group `SIDE_EFFECTS` (#0) but is in group `node:.*` (#1)",
                }, {
                    message: "@app/user600 should be in group `@app/.*` (#3) but is in group `THE_REST` (#2)",
                }, {
                    message: "Sort imports alphabetically by path. `@app/user600` should come before `ws599`",
                }],
                output: `import "cool-script598";\n` +
                    `\n` +
                    `import console from "node:console596";\n` +
                    `import fs from "node:fs597";\n` +
                    `\n` +
                    `import WsWebSocket from "ws599";\n` +
                    `\n` +
                    `import User from "@app/user600";\n`,
            }, {
                code: `import "more-side-effects601";\n` +
                    `\n` +
                    `import console from "node:console602";\n` +
                    `import fs from "node:fs603";\n` +
                    `\n` +
                    `import yargs from "yargs604";\n` +
                    `\n` +
                    `import Article from "@app/article605";\n` +
                    `import "@app/side-effects606";\n` +
                    `import User from "@app/user607";\n`,
                options: [{
                    sortSideEffectsFirst: true,
                    groups: [
                        "node:.*",
                        "THE_REST",
                        "@app/.*",
                    ],
                }],
                errors: [{
                    message: "@app/side-effects606 should be in group `SIDE_EFFECTS` (#0) but is in group `@app/.*` (#3)",
                }, {
                    message: "Sort side-effects-only modules before others. `import \"@app/side-effects606\";` should come before `import Article from \"@app/article605\";`",
                }],
                output: `import "@app/side-effects606";\n` +
                    `import "more-side-effects601";\n` +
                    `\n` +
                    `import console from "node:console602";\n` +
                    `import fs from "node:fs603";\n` +
                    `\n` +
                    `import yargs from "yargs604";\n` +
                    `\n` +
                    `import Article from "@app/article605";\n` +
                    `import User from "@app/user607";\n`,
            }],
        });
    });
});

const tsRuleTester = new RuleTester({
    languageOptions: {
        parser: { parse },
    },
});

describe("ordered-imports-by-path TS", () => {
    it("passes and fails appropriately", () => {
        tsRuleTester.run("ordered-imports-by-path", orderedImportsByPathRule, {
            valid: [{
                code: `import { ArrayList } from "Collections901";\n` +
                    `import type { List } from "Collections901";\n`,
                options: [{sortTypeImportsFirst: false}],
            }, {
                code: `import type { List } from "Collections902";\n` +
                    `import { ArrayList } from "Collections902";\n`,
                options: [{sortTypeImportsFirst: true}],
            },
            `import { ArrayList } from "Collections903";\n` +
                `import type { List } from "Collections903";\n`,
            `import type { List } from "Collections904";\n` +
                `import { ArrayList } from "Collections904";\n`,
            ],
            invalid: [{
                code: `import type { List } from "Collections905";\n` +
                    `import { ArrayList } from "Collections905";\n`,
                options: [{sortTypeImportsFirst: false}],
                errors: [{
                    messageId: "sortTypeImports",
                }],
                output: `import { ArrayList } from "Collections905";\n` +
                    `import type { List } from "Collections905";\n`,
            }, {
                code: `import { ArrayList } from "Collections906";\n` +
                    `import type { List } from "Collections906";\n`,
                options: [{sortTypeImportsFirst: true}],
                errors: [{
                    messageId: "sortTypeImports",
                }],
                output: `import type { List } from "Collections906";\n` +
                    `import { ArrayList } from "Collections906";\n`,
            }],
        });
    });
});

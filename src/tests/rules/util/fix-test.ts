/* eslint-disable @typescript-eslint/no-floating-promises */
import { AST as Ast, Rule, SourceCode } from "eslint";
import type { AssignmentProperty, Identifier, ImportSpecifier, Node } from "estree";
import { deepStrictEqual } from "node:assert";
import { describe, it } from "node:test";

import { fixUnsortedKeysWithComments } from "@adashrodEps/lib/rules/util/fix";
import { StringCompareOptions } from "@adashrodEps/lib/rules/util/strings";

describe("fix", () => {
    describe("fixUnsortedKeysWithComments", () => {
        it(`returns returns the correct range and fix #1`, (ctx) => {
            const code = `import { Bravo, Alpha/*, Charlie */ } from "alphabet";`;
            const mockFixer = {
                replaceTextRange: (range: Ast.Range, text: string): Rule.Fix => ({ range, text }),
            };
            const mockSourceCode = {
                getText: (node?: Node): string => {
                    if (node !== undefined) {
                        return ((node as ImportSpecifier).imported as Identifier).name;
                    }
                    return code;
                },
            };
            const tokens: Ast.Token[] = [{
                type: "Keyword",
                value: "import",
                loc: { start: { line: 1, column: 0 }, end: { line: 1, column: 6 } },
                range: [0, 6],
            }, {
                type: "Punctuator",
                value: "{",
                loc: { start: { line: 1, column: 7 }, end: { line: 1, column: 8 } },
                range: [7, 8],
            }, {
                type: "Identifier",
                value: "Bravo",
                loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                range: [9, 14],
            }, {
                type: "Punctuator",
                value: ",",
                loc: { start: { line: 1, column: 4 }, end: { line: 1, column: 5 } },
                range: [14, 15],
            }, {
                type: "Identifier",
                value: "Alpha",
                loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                range: [16, 21],
            }, {
                type: "Punctuator",
                value: "}",
                loc: { start: { line: 3, column: 6 }, end: { line: 3, column: 7 } },
                range: [36, 37],
            }, {
                type: "Identifier",
                value: "from",
                loc: { start: { line: 3, column: 8 }, end: { line: 4, column: 2 } },
                range: [38, 42],
            }, {
                type: "String",
                value: "\"alphabet\"",
                loc: { start: { line: 4, column: 3 }, end: { line: 5, column: 3 } },
                range: [43, 53],
            }, {
                type: "Punctuator",
                value: ";",
                loc: { start: { line: 5, column: 3 }, end: { line: 5, column: 4 } },
                range: [53, 54],
            }];
            const keys = [{
                type: "ImportSpecifier",
                loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                range: [9, 14],
                imported: {
                    type: "Identifier",
                    loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                    range: [9, 14],
                    name: "Bravo",
                    parent: null, // [Circular],
                },
                local: {
                    type: "Identifier",
                    loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                    range: [9, 14],
                    name: "Bravo",
                    parent: null, // [Circular],
                },
                parent: {
                    type: "ImportDeclaration",
                    loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 4 } },
                    range: [0, 54],
                    specifiers: [
                        null, // [Circular],
                        {
                            type: "ImportSpecifier",
                            loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                            range: [16, 21],
                            imported: {
                                type: "Identifier",
                                loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                                range: [16, 21],
                                name: "Alpha",
                                parent: null, // [Circular],
                            },
                            local: {
                                type: "Identifier",
                                loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                                range: [16, 21],
                                name: "Alpha",
                                parent: null, // [Circular],
                            },
                            parent: null, // [Circular],
                        },
                    ],
                    source: {
                        type: "Literal",
                        loc: { start: { line: 4, column: 3 }, end: { line: 5, column: 3 } },
                        range: [43, 53],
                        value: "alphabet",
                        raw: "\"alphabet\"",
                        parent: null, // [Circular],
                    },
                    parent: {
                        type: "Program",
                        loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 4 } },
                        range: [0, 54],
                        body: [
                            null, // [Circular],
                        ],
                        sourceType: "module",
                        comments: [
                            {
                                type: "Block",
                                value: ", Charlie ",
                                range: [21, 35],
                                loc: { start: { line: 2, column: 1 }, end: { line: 3, column: 5 } },
                            },
                        ],
                        tokens,
                        parent: null,
                    },
                },
            }, {
                type: "ImportSpecifier",
                loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                range: [16, 21],
                imported: {
                    type: "Identifier",
                    loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                    range: [16, 21],
                    name: "Alpha",
                    parent: null, // [Circular],
                },
                local: {
                    type: "Identifier",
                    loc: { start: { line: 1, column: 6 }, end: { line: 2, column: 1 } },
                    range: [16, 21],
                    name: "Alpha",
                    parent: null, // [Circular],
                },
                parent: {
                    type: "ImportDeclaration",
                    loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 4 } },
                    range: [0, 54],
                    specifiers: [
                        {
                            type: "ImportSpecifier",
                            loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                            range: [9, 14],
                            imported: {
                                type: "Identifier",
                                loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                                range: [9, 14],
                                name: "Bravo",
                                parent: null, // [Circular],
                            },
                            local: {
                                type: "Identifier",
                                loc: { start: { line: 1, column: 9 }, end: { line: 1, column: 4 } },
                                range: [9, 14],
                                name: "Bravo",
                                parent: null, // [Circular],
                            },
                            parent: null, // [Circular],
                        },
                        null, // [Circular],
                    ],
                    source: {
                        type: "Literal",
                        loc: { start: { line: 4, column: 3 }, end: { line: 5, column: 3 } },
                        range: [43, 53],
                        value: "alphabet",
                        raw: "\"alphabet\"",
                        parent: null, // [Circular],
                    },
                    parent: {
                        type: "Program",
                        loc: { start: { line: 1, column: 0 }, end: { line: 5, column: 4 } },
                        range: [0, 54],
                        body: [
                            null, // [Circular],
                        ],
                        sourceType: "module",
                        comments: [
                            {
                                type: "Block",
                                value: ", Charlie ",
                                range: [21, 35],
                                loc: { start: { line: 2, column: 1 }, end: { line: 3, column: 5 } },
                            },
                        ],
                        tokens,
                        parent: null,
                    },
                },
            }];
            const options: StringCompareOptions = { ignoreCase: false, natural: false };

            deepStrictEqual(
                fixUnsortedKeysWithComments(
                    mockFixer as Rule.RuleFixer,
                    keys as unknown as AssignmentProperty[],
                    tokens,
                    mockSourceCode as SourceCode,
                    options
                ), { range: [9, 36], text: `Alpha,/*, Charlie */ Bravo, ` }, ctx.name);
        });
    });
});

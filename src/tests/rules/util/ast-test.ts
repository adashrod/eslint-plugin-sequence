/* eslint-disable @typescript-eslint/no-floating-promises */
import { AST as Ast } from "eslint";
import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";

import { findPunctuatorAfter, findPunctuatorBetween } from "@adashrodEps/lib/rules/util/ast";

const Json = JSON;

describe("ast", () => {
    describe("findPunctuatorAfter", () => {
        const loc = { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
        const tokens = [
            { type: "Punctuator", value: ",", range: [0, 1], loc },
            { type: "Punctuator", value: ",", range: [2, 3], loc },
            { type: "Punctuator", value: ",", range: [4, 5], loc }
        ] satisfies Ast.Token[];

        const testCases = [
            [0, tokens[0]],
            [1, tokens[1]],
            [2, tokens[1]],
            [3, tokens[2]],
            [4, tokens[2]],
            [5, null],
            [6, null]
        ] satisfies [number, Ast.Token | null][];
        testCases.forEach(([startPos, expected]) => {
            it(`returns ${Json.stringify(expected)} for startPos=${startPos}`, () => {
                deepStrictEqual(findPunctuatorAfter(tokens, startPos, ","), expected);
            });
        });

        it("returns null if there are no tokens", () => {
            strictEqual(findPunctuatorAfter([], 0, ","), null);
        });
    });

    describe("findPunctuatorBetween", () => {
        const loc = { start: { line: 0, column: 0 }, end: { line: 0, column: 0 } };
        const tokens = [
            { type: "Punctuator", value: ",", range: [0, 1], loc },
            { type: "Punctuator", value: ",", range: [2, 3], loc },
            { type: "Punctuator", value: ",", range: [4, 5], loc }
        ] satisfies Ast.Token[];

        const testCases1 = [
            [0, 2, tokens[0]],
            [1, 4, tokens[1]],
            [2, 4, tokens[1]],
            [3, 6, tokens[2]],
            [4, 6, tokens[2]],
            [5, 6, null],
            [6, 8, null]
        ] satisfies [number, number, Ast.Token | null][];
        testCases1.forEach(([startPos, endPos, expected]) => {
            it(`returns ${Json.stringify(expected)} for startPos=${startPos} endPos=${endPos}`, () => {
                deepStrictEqual(findPunctuatorBetween(tokens, startPos, endPos, ","), expected);
            });
        });

        const mixedTokens = [
            { type: "Punctuator", value: ",", range: [10, 11], loc },
            { type: "Punctuator", value: ".", range: [22, 23], loc },
            { type: "Punctuator", value: ";", range: [30, 31], loc },
            { type: "Punctuator", value: ",", range: [40, 41], loc },
        ] satisfies Ast.Token[];

        const testCases2 = [
            [0, 10, null],
            [1, 10, null],
            [10, 22, mixedTokens[0]],
            [10, 23, mixedTokens[0]],
            [10, 30, mixedTokens[0]],
            [10, 40, mixedTokens[0]],
            [22, 30, null],
            [22, 40, null],
            [30, 40, null],
            [30, 50, mixedTokens[3]],
            [40, 50, mixedTokens[3]],
            [40, 60, mixedTokens[3]],
            [50, 60, null],
            [50, 70, null],
        ] satisfies [number, number, Ast.Token | null][];
        testCases2.forEach(([startPos, endPos, expected]) => {
            it(`returns ${Json.stringify(expected)} for startPos=${startPos} endPos=${endPos}`, () => {
                deepStrictEqual(findPunctuatorBetween(mixedTokens, startPos, endPos, ","), expected);
            });
        });

        it("returns null if there are no tokens", () => {
            strictEqual(findPunctuatorBetween([], 0, 10, ","), 1);
        });
    });
});

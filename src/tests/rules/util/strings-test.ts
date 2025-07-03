/* eslint-disable @typescript-eslint/no-floating-promises */
import { deepStrictEqual, strictEqual } from "node:assert";
import { describe, it } from "node:test";

import {
    capitalize,
    isAllCaps,
    isAllCapsAndDigits,
    isAllCapsSnakeCase,
    isAlpha,
    isDigit,
    isLower,
    isMixedSnakeCase,
    isUpper,
    stringCompare,
    tokenizeMixedSnakeCase,
    tokenizePotentiallyInvalidCamelCase,
} from "@adashrodEps/lib/rules/util/strings";

describe("strings", () => {
    describe("isAlpha", () => {
        it("returns true for a letter", (ctx) => {
            strictEqual(isAlpha("a"), true, ctx.name);
        });

        it("returns false for a digit", (ctx) => {
            strictEqual(isAlpha("1"), false, ctx.name);
        });

        it("returns false for a symbol", (ctx) => {
            strictEqual(isAlpha("!"), false, ctx.name);
        });
    });

    describe("isDigit", () => {
        it("returns false for a letter", (ctx) => {
            strictEqual(isDigit("a"), false, ctx.name);
        });

        it("returns true for a digit", (ctx) => {
            strictEqual(isDigit("1"), true, ctx.name);
        });

        it("returns false for a symbol", (ctx) => {
            strictEqual(isDigit("!"), false, ctx.name);
        });
    });

    describe("isUpper", () => {
        it("returns false for a lower case letter", (ctx) => {
            strictEqual(isUpper("a"), false, ctx.name);
        });

        it("returns false for a digit", (ctx) => {
            strictEqual(isUpper("1"), false, ctx.name);
        });

        it("returns true for an upper case letter", (ctx) => {
            strictEqual(isUpper("N"), true, ctx.name);
        });
    });

    describe("isLower", () => {
        it("returns true for a lower case letter", (ctx) => {
            strictEqual(isLower("a"), true, ctx.name);
        });

        it("returns false for a digit", (ctx) => {
            strictEqual(isLower("1"), false, ctx.name);
        });

        it("returns false for an upper case letter", (ctx) => {
            strictEqual(isLower("N"), false, ctx.name);
        });
    });

    describe("isAllCaps", () => {
        [
            "ABC",
            "HELLO",
            "WORLD",
            "XYZ",
        ].forEach(s => {
            it(`returns true for ${s}`, (ctx) => {
                strictEqual(isAllCaps(s), true, ctx.name);
            });
        });

        [
            "abc",
            "Abc",
            "hello",
            "world",
            "Hello",
            "World",
            "Xyz",
        ].forEach(s =>
            it(`returns false for ${s}`, (ctx) => {
                strictEqual(isAllCaps(s), false, ctx.name);
            })
        );
    });

    describe("isAllCapsAndDigits", () => {
        [
            "ABC",
            "HELLO",
            "WORLD",
            "XYZ",
            "AB4C",
            "H5ELLO",
            "WO5RLD",
            "XYZ2",
        ].forEach(s => {
            it(`returns true for ${s}`, (ctx) => {
                strictEqual(isAllCapsAndDigits(s), true, ctx.name);
            });
        });

        [
            "abc",
            "Abc",
            "hello",
            "world",
            "Hello",
            "World",
            "Xyz",
            "ab3c",
            "A46bc",
            "he2llo",
            "wor3ld",
            "He7llo",
            "Wo9rld",
            "X0yz",
        ].forEach(s =>
            it(`returns false for ${s}`, (ctx) => {
                strictEqual(isAllCapsAndDigits(s), false, ctx.name);
            })
        );
    });

    describe("capitalize", () => {
        [
            ["aoeu", "Aoeu"],
            ["hello", "Hello"],
            ["World", "World"],
        ].forEach(([before, after]) =>
            it(`returns ${after} for ${before}`, (ctx) => {
                strictEqual(capitalize(before), after, ctx.name);
            })
        );
    });

    describe("tokenizePotentiallyInvalidCamelCase", () => {
        const testCases = [
            ["XMLHttpRequest", ["XML", "Http", "Request"]],
            ["htmlToXml", ["html", "To", "Xml"]],
            ["HTMLDivElement", ["HTML", "Div", "Element"]],
            ["HTMLHtmlElement", ["HTML", "Html", "Element"]],
            ["HTMLToXML", ["HTML", "To", "XML"]],
            ["helloWorld", ["hello", "World"]],
            ["HelloWorld", ["Hello", "World"]],
            ["hello", ["hello"]],
            ["Hello", ["Hello"]],
            ["_hello", ["_hello"]],
            ["_Hello", ["_", "Hello"]],
            ["_Hello_", ["_", "Hello_"]],
            ["_hello_", ["_hello_"]],
            ["_helloWorld_", ["_hello", "World_"]],
            ["_HelloWorld_", ["_", "Hello", "World_"]],
            ["_HelloWorld", ["_", "Hello", "World"]],
            ["The30thDay", ["The", "30th", "Day"]],
            ["ThereAre4Lights", ["There", "Are", "4", "Lights"]],
            ["ThereAre4000Lights", ["There", "Are", "4000", "Lights"]],
            ["HEEEYa", ["HEEE", "Ya"]],
            ["HEEEYaHEY", ["HEEE", "Ya", "HEY"]],
            ["HEEEYaHey", ["HEEE", "Ya", "Hey"]],
        ] satisfies [string, string[]][];
        testCases.forEach(([s, result]) =>
            it(`returns ${result} for ${s}`, (ctx) => {
                deepStrictEqual(tokenizePotentiallyInvalidCamelCase(s), result, ctx.name);
            })
        );
    });

    describe("tokenizeMixedSnakeCase", () => {
        const testCases = [
            ["HELLO_WORLD", ["HELLO", "WORLD"]],
            ["HELLO_world", ["HELLO", "world"]],
            ["HELLO_World_123", ["HELLO", "World", "123"]],
            ["HELLO_WORLD_123_456C", ["HELLO", "WORLD", "123", "456C"]],
            ["HELLO_world_123A_456B_789", ["HELLO", "world", "123A", "456B", "789"]],
            ["hello_world", ["hello", "world"]],
            ["_hello_world", ["_", "hello", "world"]],
            ["_hello_world_", ["_", "hello", "world", "_"]],
            ["_Hello_world_", ["_", "Hello", "world", "_"]],
        ] satisfies [string, string[]][];
        testCases.forEach(([s, result]) =>
            it(`returns ${result} for ${s}`, (ctx) => {
                deepStrictEqual(tokenizeMixedSnakeCase(s), result, ctx.name);
            })
        );
    });

    describe("isAllCapsSnakeCase", () => {
        [
            "HELLO_WORLD",
            "HELLO_WORLD_123",
            "HELLO_WORLD_123_456C",
            "HELLO_WORLD_123A_456B_789",
        ].forEach(s => {
            it(`returns true for ${s}`, (ctx) => {
                strictEqual(isAllCapsSnakeCase(s), true, ctx.name);
            });
        });

        [
            "HELLO_World",
            "HELLO_WORLd_123",
            "HelloWorld",
            "hello_world",
            "HELLO",
        ].forEach(s =>
            it(`returns false for ${s}`, (ctx) => {
                strictEqual(isAllCapsSnakeCase(s), false, ctx.name);
            })
        );
    });

    describe("isMixedSnakeCase", () => {
        [
            "HELLO_WORLD",
            "HELLO_world",
            "HELLO_World_123",
            "HELLO_WORLD_123_456C",
            "HELLO_world_123A_456B_789",
            "hello_world",
            "_hello_world",
            "_hello_world_",
            "_Hello_world_",
        ].forEach(s =>
            it(`returns true for ${s}`, (ctx) => {
                strictEqual(isMixedSnakeCase(s), true, ctx.name);
            })
        );

        [
            "HelloWorld",
            "helloWorld",
            "hello",
        ].forEach(s =>
            it(`returns false for ${s}`, (ctx) => {
                strictEqual(isMixedSnakeCase(s), false, ctx.name);
            })
        );
    });

    describe("stringCompare", () => {
        type ScTestCase = Parameters<typeof stringCompare>;

        function testCaseDescription([left, right, options]: ScTestCase): string {
            return `left: ${left}, right: ${right}, ignoreCase: ${options.ignoreCase}, natural: ${options.natural}`;
        }

        describe("a < b", () => {
            const testCases: ScTestCase[] = [
                ["a", "b", { ignoreCase: false, natural: false }],
                ["A", "a", { ignoreCase: false, natural: false }],
                ["A", "b", { ignoreCase: false, natural: false }],
                ["A", "B", { ignoreCase: false, natural: false }],
                ["a", "B", { ignoreCase: true, natural: false }],
                ["key10", "key5", { ignoreCase: false, natural: false }],
                ["Key10", "key5", { ignoreCase: true, natural: false }],
                ["key5", "key10", { ignoreCase: false, natural: true }],
                ["key5", "Key10", { ignoreCase: true, natural: true }],
            ] satisfies ScTestCase[];
            testCases.forEach(([left, right, options]) =>
                it(`returns -1 for ${testCaseDescription([left, right, options])}`, (ctx) => {
                    strictEqual(stringCompare(left, right, options), -1, ctx.name);
                })
            );
        });

        describe("a > b", () => {
            const testCases: ScTestCase[] = [
                ["b", "a", { ignoreCase: false, natural: false }],
                ["a", "A", { ignoreCase: false, natural: false }],
                ["b", "A", { ignoreCase: false, natural: false }],
                ["B", "A", { ignoreCase: false, natural: false }],
                ["B", "a", { ignoreCase: true, natural: false }],
                ["key5", "key10", { ignoreCase: false, natural: false }],
                ["key5", "Key10", { ignoreCase: true, natural: false }],
                ["key10", "key5", { ignoreCase: false, natural: true }],
                ["Key10", "key5", { ignoreCase: true, natural: true }],
            ] satisfies ScTestCase[];
            testCases.forEach(([left, right, options]) =>
                it(`returns 1 for ${testCaseDescription([left, right, options])}`, (ctx) => {
                    strictEqual(stringCompare(left, right, options), 1, ctx.name);
                })
            );
        });

        describe("a === b", () => {
            const testCases: ScTestCase[] = [
                ["a", "a", { ignoreCase: false, natural: false }],
                ["a", "A", { ignoreCase: true, natural: false }],
                ["A", "a", { ignoreCase: true, natural: false }],
                ["A", "A", { ignoreCase: false, natural: false }],
            ] satisfies ScTestCase[];
            testCases.forEach(([left, right, options]) =>
                it(`returns 0 for ${testCaseDescription([left, right, options])}`, (ctx) => {
                    strictEqual(stringCompare(left, right, options), 0, ctx.name);
                })
            );
        });
    });
});

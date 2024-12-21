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
    tokenizeMixedSnakeCase,
    tokenizePotentiallyInvalidCamelCase
} from "@adashrodEps/lib/rules/util/strings";

describe("strings", () => {
    describe("isAlpha", () => {
        it("returns true for a letter", () => {
            strictEqual(isAlpha("a"), true);
        });

        it("returns false for a digit", () => {
            strictEqual(isAlpha("1"), false);
        });

        it("returns false for a symbol", () => {
            strictEqual(isAlpha("!"), false);
        });
    });

    describe("isDigit", () => {
        it("returns false for a letter", () => {
            strictEqual(isDigit("a"), false);
        });

        it("returns true for a digit", () => {
            strictEqual(isDigit("1"), true);
        });

        it("returns false for a symbol", () => {
            strictEqual(isDigit("!"), false);
        });
    });

    describe("isUpper", () => {
        it("returns false for a lower case letter", () => {
            strictEqual(isUpper("a"), false);
        });

        it("returns false for a digit", () => {
            strictEqual(isUpper("1"), false);
        });

        it("returns true for an upper case letter", () => {
            strictEqual(isUpper("N"), true);
        });
    });

    describe("isLower", () => {
        it("returns true for a lower case letter", () => {
            strictEqual(isLower("a"), true);
        });

        it("returns false for a digit", () => {
            strictEqual(isLower("1"), false);
        });

        it("returns false for an upper case letter", () => {
            strictEqual(isLower("N"), false);
        });
    });

    describe("isAllCaps", () => {
        [
            "ABC",
            "HELLO",
            "WORLD",
            "XYZ"
        ].forEach(s => {
            it(`returns true for ${s}`, () => {
                strictEqual(isAllCaps(s), true);
            });
        });

        [
            "abc",
            "Abc",
            "hello",
            "world",
            "Hello",
            "World",
            "Xyz"
        ].forEach(s =>
            it(`returns false for ${s}`, () => {
                strictEqual(isAllCaps(s), false);
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
            "XYZ2"
        ].forEach(s => {
            it(`returns true for ${s}`, () => {
                strictEqual(isAllCapsAndDigits(s), true);
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
            "X0yz"
        ].forEach(s =>
            it(`returns false for ${s}`, () => {
                strictEqual(isAllCapsAndDigits(s), false);
            })
        );
    });

    describe("capitalize", () => {
        [
            ["aoeu", "Aoeu"],
            ["hello", "Hello"],
            ["World", "World"]
        ].forEach(([before, after]) => 
            it(`returns ${after} for ${before}`, () => {
                strictEqual(capitalize(before), after);
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
            ["_HelloWorld", ["_", "Hello", "World"]]
        ] satisfies [string, string[]][];
        testCases.forEach(([s, result]) => 
            it(`returns ${result} for ${s}`, () => {
                deepStrictEqual(tokenizePotentiallyInvalidCamelCase(s), result);
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
            it(`returns ${result} for ${s}`, () => {
                deepStrictEqual(tokenizeMixedSnakeCase(s), result);
            })
        );
    });

    describe("isAllCapsSnakeCase", () => {
        [
            "HELLO_WORLD",
            "HELLO_WORLD_123",
            "HELLO_WORLD_123_456C",
            "HELLO_WORLD_123A_456B_789"
        ].forEach(s => {
            it(`returns true for ${s}`, () => {
                strictEqual(isAllCapsSnakeCase(s), true);
            });
        });

        [
            "HELLO_World",
            "HELLO_WORLd_123",
            "HelloWorld",
            "hello_world",
            "HELLO"
        ].forEach(s => 
            it(`returns false for ${s}`, () => {
                strictEqual(isAllCapsSnakeCase(s), false);
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
            it(`returns true for ${s}`, () => {
                strictEqual(isMixedSnakeCase(s), true);
            })
        );

        [
            "HelloWorld",
            "helloWorld",
            "hello"
        ].forEach(s => 
            it(`returns false for ${s}`, () => {
                strictEqual(isMixedSnakeCase(s), false);
            })
        );
    });
});

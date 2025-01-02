import { Rule } from "eslint";
import type { AST as Ast, SourceCode } from "eslint";
import type { AssignmentProperty } from "estree";

import { findPunctuatorAfter, findPunctuatorBetween } from "@adashrodEps/lib/rules/util/ast";
import { GenericImportSpecifier } from "@adashrodEps/lib/rules/util/types";

/**
 * Given a list of destructured object properties or import specifiers that need to be sorted, and can have surrounding
 * comments, sort them by name, maintaining comments relative to identifiers.
 * E.g. before:
 * import {
 *     B, // beautiful
 *     A // awesome
 * } from ...
 * after:
 * import {
 *     A, // awesome
 *     B, // beautiful
 * } from ...
 * 
 * before:
 * const {
 *     b, // beautiful
 *     a // awesome
 * } = ...
 * after:
 * const {
 *     a, // awesome
 *     b, // beautiful
 * } = ...
 *
 * @param fixer            the rule fixer
 * @param keys             array of ObjectPattern properties or ImportDeclaration specifiers to be sorted
 * @param tokens           array of program tokens
 * @param sourceCode       the source code
 * @param ignoreCase       whether to ignore case when sorting
 * @returns an executed fix
 * @throws if any specifier/property has a range property that is undefined, or if the closing brace token is not found (shouldn't be possible)
 */
export function fixUnsortedKeysWithComments(
    fixer: Rule.RuleFixer,
    keys: (AssignmentProperty | GenericImportSpecifier)[],
    tokens: Ast.Token[],
    sourceCode: SourceCode,
    ignoreCase: boolean
): Rule.Fix {
    if (keys.some(s => !s.range)) {
        throw new Error("range property undefined in Property(ies); can't do fix");
    }
    // using the closing brace as the bound ensures that any comments after the last prop/specifier get moved along
    // with that prop/specifier
    const closingBraceToken = findPunctuatorAfter(tokens,
        keys[keys.length - 1].range![1], "}");
    const restOperatorToken = findPunctuatorAfter(tokens,
        keys[keys.length - 1].range![1],
        "...");
    if (!closingBraceToken) {
        throw new Error("no `}` found at end of property/specifier list");
    }
    let endToken = closingBraceToken;
    let trailingCommaToken = null;
    // todo: after refactoring, consider if adding the trailing comma is necessary
    let addTrailingComma = false;
    if (restOperatorToken !== null) {
        // if there's a rest operator, it should be kept in place; this also means there's no trailing comma
        endToken = endToken.range[0] < restOperatorToken.range[0] ? endToken : restOperatorToken;
    } else {
        trailingCommaToken = findPunctuatorBetween(tokens,
            keys[keys.length - 1].range![1],
            closingBraceToken.range[0],
            ",");
        addTrailingComma = trailingCommaToken === null;
    }
    return fixer.replaceTextRange(
        [keys[0].range![0], endToken.range[0]],
        keys.slice()
            .map((key: AssignmentProperty | GenericImportSpecifier, index: number) =>
                sourceCode.getText(key) +
                    (index + 1 === keys.length && addTrailingComma ? "," : "") +
                    sourceCode.getText().slice(key.range![1],
                        index + 1 < keys.length ?
                            keys[index + 1].range![0] :
                            endToken.range[0])
            )
            // at this point the mapped strings contain the properties/specifiers, commas, and comments
            .sort((keyStringA, keyStringB) => {
                const nameA = ignoreCase ? keyStringA.toLowerCase() : keyStringA;
                const nameB = ignoreCase ? keyStringB.toLowerCase() : keyStringB;
                return nameA > nameB ? 1 : -1;
            })
            .join("")
    );
}

const { nullishCoalesce } = require("./util/misc-js.js");

/**
 * @fileoverview Rule to enforce ordering of import members by name
 * @author Aaron Rodriguez
 */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description:
                "enforce sorted import declarations, sorting imports by path, not name and sorted members in imports",
            recommended: false,
            url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-import-members.md"
        },

        schema: [{
            type: "object",
            properties: {
                ignoreCase: {
                    type: "boolean",
                    default: false
                },
                sortSpecifiersWithComments: {
                    type: "boolean",
                    default: false
                }
            },
            additionalProperties: false
        }],

        fixable: "code",

        messages: {
            sortMembersAlphabetically:
                "Sort import members alphabetically. \"{{specifierA}}\" should come before \"{{specifierB}}\"."
        }
    },
    create(context) {
        const configuration = context.options[0] || {},
            ignoreCase = nullishCoalesce(configuration.ignoreCase, false),
            sortSpecifiersWithComments = nullishCoalesce(configuration.sortSpecifiersWithComments, false),
            sourceCode = context.getSourceCode();

        /**
         * Comparares ImportSpecifiers by name, honoring the value of ignoreCase
         *
         * @param {AstNode} specifierA an ImportSpecifier
         * @param {AstNode} specifierB an ImportSpecifier
         * @returns comparator result
         */
        function importSpecifierComparator(specifierA, specifierB) {
            const nameA = ignoreCase ? specifierA.local.name.toLowerCase() : specifierA.local.name;
            const nameB = ignoreCase ? specifierB.local.name.toLowerCase() : specifierB.local.name;
            return nameA > nameB ? 1 : -1;
        }

        /**
         * Finds the first matching punctuator at document position greater than or equal to startPos.
         *
         * @param {Ast.Token[]} tokens array of program tokens
         * @param {number} startPos    minimum document position
         * @param {string} punctuator  a punctuator, such as ","
         * @returns found token or undefined if not found
         */
        function findPunctuatorAfter(tokens, startPos, punctuator) {
            return tokens.find(token =>
                token.type === "Punctuator" &&
                token.value === punctuator &&
                token.range[0] >= startPos
            )
        }

        /**
         * Finds the first matching punctuator at document position greater than or equal to startPos and less than
         * endPos.
         *
         * @param {Ast.Token[]} tokens array of program tokens
         * @param {number} startPos   minimum document position (inclusive)
         * @param {number} endPos     maximum document position (exclusive)
         * @param {string} punctuator a punctuator, such as ","
         * @returns found token or undefined if not found
         */
        function findPunctuatorBetween(tokens, startPos, endPos, punctuator) {
            return tokens.find(token =>
                token.type === "Punctuator" &&
                token.value === punctuator &&
                token.range[0] >= startPos &&
                token.range[1] < endPos
            )
        }

        /**
         * Given a list of specifiers that need to be sorted, and don't have surrounding comments, sort them by
         * specifier name.
         *
         * @param {Rule.RuleFixer} fixer the rule fixer
         * @param {AstNode[]} importSpecifiers all specifiers in an ImportDeclaration
         * @returns an executed fix
         */
        function fixSimpleSpecifiers(fixer, importSpecifiers) {
            return fixer.replaceTextRange(
                [importSpecifiers[0].range[0], importSpecifiers[importSpecifiers.length - 1].range[1]],
                importSpecifiers
                    .slice()
                    .sort(importSpecifierComparator)
                    .map((specifier, index) =>
                        sourceCode.getText(specifier) + (index === importSpecifiers.length - 1 ? "" :
                            sourceCode.getText().slice(
                                importSpecifiers[index].range[1],
                                importSpecifiers[index + 1].range[0]))
                    )
                    .join("")
            );
        }

        /**
         * Given a list of specifiers that need to be sorted, and do have surrounding comments, sort them by specifier
         * name, maintaining comments relative to specifiers.
         * E.g.before:
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
         * @param {Rule.RuleFixer} fixer            the rule fixer
         * @param {Ast.Token[]}    tokens           array of program tokens
         * @param {AstNode[]}      importSpecifiers all specifiers in an ImportDeclaration
         * @returns an executed fix
         */
        function fixSpecifiersWithComments(fixer, tokens, importSpecifiers) {
            // using the closing brace as the bound ensures that any comments after the last specifier get moved along
            // with that specifier
            const closingBraceToken = findPunctuatorAfter(tokens,
                importSpecifiers[importSpecifiers.length - 1].range[1], "}");
            if (!closingBraceToken) {
                console.error("no `}` found at end of specifier list");
                return null;
            }
            const trailingCommaToken = findPunctuatorBetween(tokens,
                importSpecifiers[importSpecifiers.length - 1].range[1],
                closingBraceToken.range[0],
                ",");
            return fixer.replaceTextRange(
                [importSpecifiers[0].range[0], closingBraceToken.range[0]],
                importSpecifiers.slice()
                    .map((specifier, index) =>
                        sourceCode.getText(specifier) +
                            (index + 1 === importSpecifiers.length && !trailingCommaToken ? "," : "") +
                            sourceCode.getText().slice(specifier.range[1],
                                index + 1 < importSpecifiers.length ?
                                    importSpecifiers[index + 1].range[0] :
                                    closingBraceToken.range[0])
                    )
                    // at this point the mapped strings contain the specifiers, commas, and comments
                    .sort((specifierStringA, specifierStringB) => {
                        const nameA = ignoreCase ? specifierStringA.toLowerCase() : specifierStringA;
                        const nameB = ignoreCase ? specifierStringB.toLowerCase() : specifierStringB;
                        return nameA > nameB ? 1 : -1;
                    })
                    .join("")
            );
        }

        return {
            ImportDeclaration: (node) => {
                const importSpecifiers = node.specifiers.filter(specifier => specifier.type === "ImportSpecifier");
                let beforeSpecifier, unsortedSpecifier;
                for (let i = 0; i < importSpecifiers.length - 1; i++) {
                    if (importSpecifierComparator(importSpecifiers[i], importSpecifiers[i + 1]) > 0) {
                        unsortedSpecifier = importSpecifiers[i + 1];
                        beforeSpecifier = importSpecifiers[i];
                    }
                }

                if (unsortedSpecifier) {
                    context.report({
                        node: unsortedSpecifier,
                        messageId: "sortMembersAlphabetically",
                        data: {
                            specifierA: unsortedSpecifier.local.name,
                            specifierB: beforeSpecifier.local.name
                        },
                        fix(fixer) {
                            const specifiersHaveComments = importSpecifiers.some(specifier =>
                                sourceCode.getCommentsBefore(specifier).length ||
                                    sourceCode.getCommentsAfter(specifier).length);
                            if (specifiersHaveComments) {
                                return sortSpecifiersWithComments ?
                                    fixSpecifiersWithComments(fixer, node.parent.tokens, importSpecifiers) :
                                    null;
                            }
                            return fixSimpleSpecifiers(fixer, importSpecifiers);
                        }
                    });
                }
            }
        };
    }
};

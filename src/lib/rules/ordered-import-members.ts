import type { AST as Ast, Rule } from "eslint";
import type {
    ImportDeclaration,
    ImportDefaultSpecifier,
    ImportNamespaceSpecifier,
    ImportSpecifier,
    Program
} from "estree";

import { findPunctuatorAfter, findPunctuatorBetween } from "@adashrodEps/lib/rules/util/ast";
import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";

type Config = {
    ignoreCase: boolean;
    sortSpecifiersWithComments: boolean;
};

const DEFAULT_PROPERTIES: Config = {
    ignoreCase: false,
    sortSpecifiersWithComments: false
};

/**
 * @fileoverview Rule to enforce ordering of import members by name
 * @author Aaron Rodriguez
 */
const meta: Rule.RuleMetaData = {
    type: "suggestion",

    docs: {
        description: "enforce sorted members in individual imports",
        recommended: false,
        url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-import-members.md"
    },

    schema: [{
        type: "object",
        properties: {
            ignoreCase: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.ignoreCase
            },
            sortSpecifiersWithComments: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.sortSpecifiersWithComments
            }
        },
        additionalProperties: false
    }],

    fixable: "code",

    messages: {
        sortMembersAlphabetically:
            "Sort import members alphabetically. \"{{specifierA}}\" should come before \"{{specifierB}}\"."
    }
};

type GenericSpecifier = ImportSpecifier | ImportDefaultSpecifier | ImportNamespaceSpecifier;

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        // context.getSourceCode() is deprecated, but context.sourceCode is always undefined in older eslint
        sourceCode = context.sourceCode ?? context.getSourceCode();

    /**
     * Comparares ImportSpecifiers by name, honoring the value of ignoreCase
     *
     * @param specifierA an ImportSpecifier
     * @param specifierB an ImportSpecifier
     * @returns comparator result
     */
    function importSpecifierComparator(specifierA: GenericSpecifier, specifierB: GenericSpecifier): number {
        const nameA = cfg.ignoreCase ? specifierA.local.name.toLowerCase() : specifierA.local.name;
        const nameB = cfg.ignoreCase ? specifierB.local.name.toLowerCase() : specifierB.local.name;
        return nameA > nameB ? 1 : -1;
    }

    /**
     * Given a list of specifiers that need to be sorted, and don't have surrounding comments, sort them by
     * specifier name.
     *
     * @param fixer the rule fixer
     * @param importSpecifiers all specifiers in an ImportDeclaration
     * @returns an executed fix
     */
    function fixSimpleSpecifiers(fixer: Rule.RuleFixer, importSpecifiers: Array<GenericSpecifier>): Rule.Fix {
        if (importSpecifiers.some(s => !s.range)) {
            throw new Error("range property undefined in ImportSpecifier(s); can't do fix");
        }
        return fixer.replaceTextRange(
            [importSpecifiers[0].range![0], importSpecifiers[importSpecifiers.length - 1].range![1]],
            importSpecifiers
                .slice()
                .sort(importSpecifierComparator)
                .map((specifier, index: number) =>
                    sourceCode.getText(specifier) + (index === importSpecifiers.length - 1 ? "" :
                        sourceCode.getText().slice(
                            importSpecifiers[index].range![1],
                            importSpecifiers[index + 1].range![0]))
                )
                .join("")
        );
    }

    /**
     * Given a list of specifiers that need to be sorted, and do have surrounding comments, sort them by specifier
     * name, maintaining comments relative to specifiers.
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
     * @param fixer            the rule fixer
     * @param tokens           array of program tokens
     * @param importSpecifiers all specifiers in an ImportDeclaration
     * @returns an executed fix
     */
    function fixSpecifiersWithComments(
        fixer: Rule.RuleFixer,
        tokens: Ast.Token[],
        importSpecifiers: Array<GenericSpecifier>
    ): Rule.Fix {
        if (importSpecifiers.some(s => !s.range)) {
            throw new Error("range property undefined in ImportSpecifier(s); can't do fix");
        }
        // using the closing brace as the bound ensures that any comments after the last specifier get moved along
        // with that specifier
        const closingBraceToken = findPunctuatorAfter(tokens,
            importSpecifiers[importSpecifiers.length - 1].range![1], "}");
        if (!closingBraceToken) {
            throw new Error("no `}` found at end of specifier list");
        }
        const trailingCommaToken = findPunctuatorBetween(tokens,
            importSpecifiers[importSpecifiers.length - 1].range![1],
            closingBraceToken.range[0],
            ",");
        return fixer.replaceTextRange(
            [importSpecifiers[0].range![0], closingBraceToken.range[0]],
            importSpecifiers.slice()
                .map((specifier, index: number) =>
                    sourceCode.getText(specifier) +
                        (index + 1 === importSpecifiers.length && !trailingCommaToken ? "," : "") +
                        sourceCode.getText().slice(specifier.range![1],
                            index + 1 < importSpecifiers.length ?
                                importSpecifiers[index + 1].range![0] :
                                closingBraceToken.range[0])
                )
                // at this point the mapped strings contain the specifiers, commas, and comments
                .sort((specifierStringA, specifierStringB) => {
                    const nameA = cfg.ignoreCase ? specifierStringA.toLowerCase() : specifierStringA;
                    const nameB = cfg.ignoreCase ? specifierStringB.toLowerCase() : specifierStringB;
                    return nameA > nameB ? 1 : -1;
                })
                .join("")
        );
    }

    return {
        ImportDeclaration: (node: ImportDeclaration & Rule.NodeParentExtension): void => {
            const importSpecifiers = node.specifiers.filter(specifier => specifier.type === "ImportSpecifier");
            let beforeSpecifier, unsortedSpecifier;
            for (let i = 0; i < importSpecifiers.length - 1; i++) {
                if (importSpecifierComparator(importSpecifiers[i], importSpecifiers[i + 1]) > 0) {
                    unsortedSpecifier = importSpecifiers[i + 1];
                    beforeSpecifier = importSpecifiers[i];
                }
            }

            if (unsortedSpecifier && beforeSpecifier) {
                context.report({
                    node: unsortedSpecifier,
                    messageId: "sortMembersAlphabetically",
                    data: {
                        specifierA: unsortedSpecifier.local.name,
                        specifierB: beforeSpecifier.local.name
                    },
                    fix(fixer: Rule.RuleFixer) {
                        const specifiersHaveComments = importSpecifiers.some(specifier =>
                            (sourceCode.getCommentsBefore(specifier).length > 0) ||
                                sourceCode.getCommentsAfter(specifier).length);
                        if (specifiersHaveComments) {
                            return cfg.sortSpecifiersWithComments ?
                                fixSpecifiersWithComments(
                                    fixer,
                                    (node.parent as Program as Ast.Program).tokens,
                                    importSpecifiers) :
                                null;
                        }
                        return fixSimpleSpecifiers(fixer, importSpecifiers);
                    }
                });
            }
        }
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

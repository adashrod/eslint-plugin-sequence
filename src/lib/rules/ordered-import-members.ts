import type { AST as Ast, Rule } from "eslint";
import type {
    ImportDeclaration,
    Program
} from "estree";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";
import { fixUnsortedKeysWithComments } from "@adashrodEps/lib/rules/util/fix";
import { stringCompare } from "@adashrodEps/lib/rules/util/strings";
import { GenericImportSpecifier } from "@adashrodEps/lib/rules/util/types";

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

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        sourceCode = context.sourceCode;

    /**
     * Comparares ImportSpecifiers by name, honoring the value of ignoreCase
     *
     * @param specifierA an ImportSpecifier
     * @param specifierB an ImportSpecifier
     * @returns comparator result
     */
    function importSpecifierComparator(specifierA: GenericImportSpecifier, specifierB: GenericImportSpecifier): number {
        return stringCompare(specifierA.local.name, specifierB.local.name, { ignoreCase: cfg.ignoreCase, natural: false });
    }

    /**
     * Given a list of specifiers that need to be sorted, and don't have surrounding comments, sort them by
     * specifier name.
     *
     * @param fixer the rule fixer
     * @param importSpecifiers all specifiers in an ImportDeclaration
     * @returns an executed fix
     */
    function fixSimpleSpecifiers(fixer: Rule.RuleFixer, importSpecifiers: Array<GenericImportSpecifier>): Rule.Fix {
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
                                sourceCode.getCommentsAfter(specifier).length > 0);
                        if (specifiersHaveComments) {
                            return cfg.sortSpecifiersWithComments ?
                                fixUnsortedKeysWithComments(
                                    fixer,
                                    importSpecifiers,
                                    (node.parent as Program as Ast.Program).tokens,
                                    sourceCode,
                                    { ignoreCase: cfg.ignoreCase, natural: false }) :
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

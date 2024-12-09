import type { AST as Ast, Rule } from "eslint";
import type {
    AssignmentProperty,
    BaseNode,
    ObjectPattern,
    RestElement,
} from "estree";

import { findPunctuatorAfter, findPunctuatorBetween } from "@adashrodEps/lib/rules/util/ast";
import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";

/**
 * @fileoverview Rule to enforce ordering of destructured properties in object patterns
 * @author Aaron Rodriguez
 */

type Config = {
    ignoreCase: boolean;
};

const DEFAULT_PROPERTIES: Config = {
    ignoreCase: false
};

const meta: Rule.RuleMetaData = {
    type: "suggestion",

    docs: {
        description: "enforce sorted properties in object patterns",
        recommended: false,
        url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-destructuring.md"
    },

    schema: [{
        type: "object",
        properties: {
            ignoreCase: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.ignoreCase
            }
        },
        additionalProperties: false
    }],

    fixable: "code",

    messages: {
        sortPropsInObjectPattern: `{{next}} should come before {{current}}`
    }
};

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        sourceCode = context.sourceCode;

    /**
     * Given a list of properties, remove any RestElement at the end of the list.
     * @param properties the list of properties
     * @returns the list of properties with any RestElement at the end removed
     */
    function trimRest(properties: (AssignmentProperty | RestElement)[]): AssignmentProperty[] {
        const trimmed = properties.slice();
        while (trimmed[trimmed.length - 1].type === "RestElement") {
            trimmed.pop();
        }
        return trimmed as AssignmentProperty[];
    }

    /**
     * todo: make common and update doc
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
     * @param properties all specifiers in an ImportDeclaration
     * @returns an executed fix
     */
    function fixPropertiesWithComments(
        fixer: Rule.RuleFixer,
        tokens: Ast.Token[],
        properties: AssignmentProperty[]
    ): Rule.Fix {
        if (properties.some(s => !s.range)) {
            throw new Error("range property undefined in Property(ies); can't do fix");
        }
        // using the closing brace as the bound ensures that any comments after the last specifier get moved along
        // with that specifier
        const closingBraceToken = findPunctuatorAfter(tokens,
            properties[properties.length - 1].range![1], "}");
        const restOperatorToken = findPunctuatorAfter(tokens,
            properties[properties.length - 1].range![1],
            "...");
        if (!closingBraceToken) {
            throw new Error("no `}` found at end of specifier list");
        }
        let endToken = closingBraceToken;
        let trailingCommaToken = null;
        // todo: after refactoring, consider if adding the trailing comma is necessary
        let addTrailingComma = false;
        if (restOperatorToken !== null) {
            endToken = endToken.range[0] < restOperatorToken.range[0] ? endToken : restOperatorToken;
        } else {
            trailingCommaToken = findPunctuatorBetween(tokens,
                properties[properties.length - 1].range![1],
                closingBraceToken.range[0],
                ",");
            addTrailingComma = trailingCommaToken === null;
        }
        return fixer.replaceTextRange(
            [properties[0].range![0], endToken.range[0]],
            properties.slice()
                .map((specifier, index: number) =>
                    sourceCode.getText(specifier) +
                        (index + 1 === properties.length && addTrailingComma ? "," : "") +
                        sourceCode.getText().slice(specifier.range![1],
                            index + 1 < properties.length ?
                                properties[index + 1].range![0] :
                                endToken.range[0])
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
        ObjectPattern: (node: ObjectPattern & Rule.NodeParentExtension): void => {
            for (let i = 0; i + 1 < node.properties.length; i++) {
                const current = node.properties[i];
                const next = node.properties[i + 1];
                if (current.type === "RestElement" || next.type === "RestElement") {
                    break;
                }
                const currentExpression = current.key;
                const nextExpression = next.key;
                // supposedly PrivateIdentifier is allowed here, and the typescript-eslint parser allows it, but both JS
                // and TS forbid private fields in objects and only allow them in classes
                if (currentExpression.type !== "Identifier" || nextExpression.type !== "Identifier") {
                    break;
                }
                let currentName = currentExpression.name;
                let nextName = nextExpression.name;
                if (cfg.ignoreCase) {
                    currentName = currentName.toLocaleLowerCase();
                    nextName = nextName.toLocaleLowerCase();
                }
                if (currentName >= nextName) {
                    let program = currentExpression as unknown as BaseNode & Rule.NodeParentExtension;
                    while (program.type !== "Program") {
                        program = program.parent;
                    }
                    const programTokens = (program as unknown as Ast.Program).tokens;
                    
                    context.report({
                        messageId: "sortPropsInObjectPattern",
                        data: {
                            current: currentExpression.name,
                            next: nextExpression.name
                        },
                        loc: node.loc!,
                        fix: (fixer: Rule.RuleFixer): Rule.Fix | null => 
                            Array.isArray(programTokens) ?
                                fixPropertiesWithComments(fixer, programTokens, trimRest(node.properties)) :
                                null
                    });
                }
            }
        },
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

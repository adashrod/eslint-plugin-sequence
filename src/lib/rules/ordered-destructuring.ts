import type { AST as Ast, Rule } from "eslint";
import type {
    AssignmentProperty,
    BaseNode,
    ObjectPattern,
    RestElement,
} from "estree";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";
import { fixUnsortedKeysWithComments } from "@adashrodEps/lib/rules/util/fix";

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
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES);

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
                                fixUnsortedKeysWithComments(fixer, trimRest(node.properties), programTokens, context.sourceCode, cfg.ignoreCase) :
                                null
                    });
                }
            }
        },
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

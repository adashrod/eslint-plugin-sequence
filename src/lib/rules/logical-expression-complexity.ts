import type { Rule } from "eslint";
import type {
    BinaryExpression,
    BinaryOperator,
    ConditionalExpression,
    Expression,
    LogicalExpression,
    PrivateIdentifier,
    UnaryExpression
} from "estree";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";

// exists just to add a bit of type safety in the schema: the code uses BinaryOperator from estree, but schema
// validation will ensure that only this subset is used in config
// using `type MyOpType = Extract<BinaryOperator, ...>` doesn't work because then TS complains about values not in this
// subset not being assignable to this
enum BinaryOperatorAsEnum {
    EQUALS = "==",
    STRICT_EQUALS = "===",
    NOT_EQUAL = "!=",
    STRICT_NOT_EQUAL = "!==",
    LESS_THAN = "<",
    LESS_THAN_EQUAL = "<=",
    GREATER_THAN = ">",
    GREATER_THAN_EQUAL = ">="
}

type Config = {
    maxHeight: number;
    maxTerms: number;
    binaryOperators: BinaryOperator[],
    includeTernary: boolean;
}

const DEFAULT_PROPERTIES: Config = {
    maxHeight: 2,
    maxTerms: 4,
    binaryOperators: [],
    includeTernary: true
};

/**
 * @fileoverview Rule to flag overly complex logical expressions
 * @author Aaron Rodriguez
 */
const meta: Rule.RuleMetaData = {
    type: "suggestion",

    docs: {
        description: "enforce complexity limits on logical expressions",
        recommended: false,
        url:
            "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/logical-expression-complexity.md"
    },

    schema: [{
        type: "object",
        properties: {
            maxHeight: {
                type: "number",
                default: DEFAULT_PROPERTIES.maxHeight
            },
            maxTerms: {
                type: "number",
                default: DEFAULT_PROPERTIES.maxTerms
            },
            binaryOperators: {
                type: "array",
                items: {
                    enum: [
                        BinaryOperatorAsEnum.EQUALS,
                        BinaryOperatorAsEnum.STRICT_EQUALS,
                        BinaryOperatorAsEnum.NOT_EQUAL,
                        BinaryOperatorAsEnum.STRICT_NOT_EQUAL,
                        BinaryOperatorAsEnum.LESS_THAN,
                        BinaryOperatorAsEnum.LESS_THAN_EQUAL,
                        BinaryOperatorAsEnum.GREATER_THAN,
                        BinaryOperatorAsEnum.GREATER_THAN_EQUAL
                    ]
                },
                minItems: 0,
                uniqueItems: true,
                default: DEFAULT_PROPERTIES.binaryOperators
            },
            includeTernary: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.includeTernary
            }
        },
        additionalProperties: false
    }],

    messages: {
        tooTall: "Expression height is {{height}}; max allowed is {{maxAllowed}}",
        tooManyTerms: "Expression has {{numTerms}} terms; max allowed is {{maxAllowed}}"
    }
};

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES);

    const heightObserved = new Set<number>();
    const countObserved = new Set<number>();

    /**
     * Calculates the height of a tree (distance from root to deepest found leaf node) counting only logical
     * expressions, binary expressions and conditional expressions as nodes
     *
     * type PrivateIdentifier is included here because for a BinaryExpression, node.left can be a PrivateIdentifier.
     * In practice, this will never happen. The only time node.left is a PrivateIdentifier is in the following type
     * of expression `#myField in myObject`, i.e. if the BinaryExpression's operator is "in". This rule doesn't
     * support the in operator, so ignore this
     *
     * @param node a node for a logical, binary, or conditional expression
     * @returns height of the tree
     */
    function calculateHeight(node: Expression | PrivateIdentifier): number {
        if (node === null || node === undefined || node.type === "PrivateIdentifier") {
            return -1;
        }
        if (node.range) {
            heightObserved.add(node.range[0]);
        }
        if (node.type === "LogicalExpression" ||
                node.type === "BinaryExpression" && cfg.binaryOperators.includes(node.operator)) {
            const leftHeight = calculateHeight(node.left);
            const rightHeight = calculateHeight(node.right);
            return Math.max(leftHeight, rightHeight) + 1;
        } else if (node.type === "UnaryExpression" && node.operator === "!") {
            return calculateHeight(node.argument) + 1;
        } else if (node.type === "ConditionalExpression" && cfg.includeTernary) {
            const testHeight = calculateHeight(node.test);
            const consequentHeight = calculateHeight(node.consequent);
            const alternateHeight = calculateHeight(node.alternate);
            return Math.max(testHeight, consequentHeight, alternateHeight) + 1;
        }
        return 0;
    }

    /**
     * Counts the number of leaf nodes in a tree, counting only logical expressions, binary expressions and
     * conditional expressions as nodes
     *
     * @param node a node for a logical, binary, or conditional expression
     * @returns number of nodes in the tree
     */
    function countTerms(node: Expression | PrivateIdentifier): number {
        // see note in calculateHeight re: types
        if (node === null || node === undefined || node.type === "PrivateIdentifier") {
            return 0;
        }
        if (node.range) {
            countObserved.add(node.range[0]);
        }
        if (node.type === "LogicalExpression" ||
                node.type === "BinaryExpression" && cfg.binaryOperators.includes(node.operator)) {
            return countTerms(node.left) + countTerms(node.right);
        } else if (node.type === "UnaryExpression" && node.operator === "!") {
            return countTerms(node.argument);
        } else if (node.type === "ConditionalExpression" && cfg.includeTernary) {
            return countTerms(node.test) + countTerms(node.consequent) + countTerms(node.alternate);
        }
        return 1;
    }

    let selector = "BinaryExpression,LogicalExpression,UnaryExpression";
    if (cfg.includeTernary) {
        selector += ",ConditionalExpression";
    }

    return {
        [selector]: (node: BinaryExpression | ConditionalExpression | LogicalExpression | UnaryExpression) => {
            if (node.type === "UnaryExpression" && node.operator !== "!") {
                return;
            }
            if (node.type === "BinaryExpression" && !cfg.binaryOperators.includes(node.operator)) {
                return;
            }
            if (cfg.maxHeight > 0 && node.range && !heightObserved.has(node.range[0])) {
                const expressionHeight = calculateHeight(node);
                if (expressionHeight > cfg.maxHeight) {
                    context.report({
                        node,
                        messageId: "tooTall",
                        data: {
                            height: expressionHeight.toString(),
                            maxAllowed: cfg.maxHeight.toString()
                        }
                    });
                }
            }
            if (cfg.maxTerms > 0 && node.range && !countObserved.has(node.range[0])) {
                const numExpressionTerms = countTerms(node);
                if (numExpressionTerms > cfg.maxTerms) {
                    context.report({
                        node,
                        messageId: "tooManyTerms",
                        data: {
                            numTerms: numExpressionTerms.toString(),
                            maxAllowed: cfg.maxTerms.toString()
                        }
                    });
                }
            }
        }
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

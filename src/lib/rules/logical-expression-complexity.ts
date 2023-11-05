import type { Rule } from "eslint";
import type {
    BinaryExpression,
    ConditionalExpression,
    Expression,
    LogicalExpression,
    UnaryExpression
} from "estree";

enum BinaryOperator {
    EQUALS = "==",
    STRICT_EQUALS = "===",
    NOT_EQUAL = "!=",
    STRICT_NOT_EQUAL = "!==",
    LESS_THAN = "<",
    LESS_THAN_EQUAL = "<=",
    GREATER_THAN = ">",
    GREATER_THAN_EQUAL = ">="
}

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
                default: 2
            },
            maxTerms: {
                type: "number",
                default: 4
            },
            binaryOperators: {
                type: "array",
                items: {
                    enum: [
                        BinaryOperator.EQUALS,
                        BinaryOperator.STRICT_EQUALS,
                        BinaryOperator.NOT_EQUAL,
                        BinaryOperator.STRICT_NOT_EQUAL,
                        BinaryOperator.LESS_THAN,
                        BinaryOperator.LESS_THAN_EQUAL,
                        BinaryOperator.GREATER_THAN,
                        BinaryOperator.GREATER_THAN_EQUAL
                    ]
                },
                minItems: 0,
                uniqueItems: true,
                default: []
            },
            includeTernary: {
                type: "boolean",
                default: true
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
    const configuration = context.options[0] || {},
        maxHeight = (configuration.maxHeight ?? 2) as number,
        maxTerms = (configuration.maxTerms ?? 4) as number,
        binaryOperators = (configuration.binaryOperators ?? []) as BinaryOperator[],
        includeTernary = (configuration.includeTernary ?? true) as boolean;

    const heightObserved = new Set<number>();
    const countObserved = new Set<number>();

    /**
     * Calculates the height of a tree (distance from root to deepest found leaf node) counting only logical
     * expressions, binary expressions and conditional expressions as nodes
     *
     * @param node a node for a logical, binary, or conditional expression
     * @returns height of the tree
     */
    function calculateHeight(node: Expression): number {
        if (node === null || node === undefined) {
            return -1;
        }
        if (node.range) {
            heightObserved.add(node.range[0]);
        }
        if (node.type === "LogicalExpression" ||
                node.type === "BinaryExpression" && binaryOperators.includes(node.operator as BinaryOperator)) {
            const leftHeight = calculateHeight(node.left);
            const rightHeight = calculateHeight(node.right);
            return Math.max(leftHeight, rightHeight) + 1;
        } else if (node.type === "UnaryExpression" && node.operator === "!") {
            return calculateHeight(node.argument) + 1;
        } else if (node.type === "ConditionalExpression" && includeTernary) {
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
    function countTerms(node: Expression): number {
        if (node === null || node === undefined) {
            return 0;
        }
        if (node.range) {
            countObserved.add(node.range[0]);
        }
        if (node.type === "LogicalExpression" ||
                node.type === "BinaryExpression" && binaryOperators.includes(node.operator as BinaryOperator)) {
            return countTerms(node.left) + countTerms(node.right);
        } else if (node.type === "UnaryExpression" && node.operator === "!") {
            return countTerms(node.argument);
        } else if (node.type === "ConditionalExpression" && includeTernary) {
            return countTerms(node.test) + countTerms(node.consequent) + countTerms(node.alternate);
        }
        return 1;
    }

    let selector = "BinaryExpression,LogicalExpression,UnaryExpression";
    if (includeTernary) {
        selector += ",ConditionalExpression";
    }

    return {
        [selector]: (node: BinaryExpression | ConditionalExpression | LogicalExpression | UnaryExpression) => {
            if (node.type === "UnaryExpression" && node.operator !== "!") {
                return;
            }
            if (node.type === "BinaryExpression" && !binaryOperators.includes(node.operator as BinaryOperator)) {
                return;
            }
            if (maxHeight > 0 && node.range && !heightObserved.has(node.range[0])) {
                const expressionHeight = calculateHeight(node);
                if (expressionHeight > maxHeight) {
                    context.report({
                        node,
                        messageId: "tooTall",
                        data: {
                            height: expressionHeight.toString(),
                            maxAllowed: maxHeight.toString()
                        }
                    });
                }
            }
            if (maxTerms > 0 && node.range && !countObserved.has(node.range[0])) {
                const numExpressionTerms = countTerms(node);
                if (numExpressionTerms > maxTerms) {
                    context.report({
                        node,
                        messageId: "tooManyTerms",
                        data: {
                            numTerms: numExpressionTerms.toString(),
                            maxAllowed: maxTerms.toString()
                        }
                    });
                }
            }
        }
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

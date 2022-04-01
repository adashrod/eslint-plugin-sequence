const { nullishCoalesce } = require("./util/misc-js.js");

/**
 * @fileoverview Rule to flag overly complex logical expressions
 * @author Aaron Rodriguez
 */
module.exports = {
    meta: {
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
                        enum: ["==", "===", "!=", "!==", "<", "<=", ">", ">="]
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
    },
    create(context) {
        const configuration = context.options[0] || {},
            maxHeight = nullishCoalesce(configuration.maxHeight, 2),
            maxTerms = nullishCoalesce(configuration.maxTerms, 4),
            binaryOperators = nullishCoalesce(configuration.binaryOperators, []),
            includeTernary = nullishCoalesce(configuration.includeTernary, true);

        const heightObserved = new Set();
        const countObserved = new Set();

        /**
         * Calculates the height of a tree (distance from root to deepest found leaf node) counting only logical
         * expressions, binary expressions and conditional expressions as nodes
         *
         * @param {AstNode} node a node for a logical, binary, or conditional expression
         * @returns height of the tree
         */
        function calculateHeight(node) {
            if (node === null || node === undefined) {
                return -1;
            }
            heightObserved.add(node.range[0]);
            if (node.type === "LogicalExpression" ||
                    node.type === "BinaryExpression" && binaryOperators.includes(node.operator)) {
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
         * @param {AstNode} node a node for a logical, binary, or conditional expression
         * @returns number of nodes in the tree
         */
        function countTerms(node) {
            if (node === null || node === undefined) {
                return 0;
            }
            countObserved.add(node.range[0]);
            if (node.type === "LogicalExpression" ||
                    node.type === "BinaryExpression" && binaryOperators.includes(node.operator)) {
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
            [selector]: (node) => {
                if (node.type === "UnaryExpression" && node.operator !== "!") {
                    return;
                }
                if (node.type === "BinaryExpression" && !binaryOperators.includes(node.operator)) {
                    return;
                }
                if (maxHeight > 0 && !heightObserved.has(node.range[0])) {
                    const expressionHeight = calculateHeight(node);
                    if (expressionHeight > maxHeight) {
                        context.report({
                            node,
                            messageId: "tooTall",
                            data: {
                                height: expressionHeight,
                                maxAllowed: maxHeight
                            }
                        });
                    }
                }
                if (maxTerms > 0 && !countObserved.has(node.range[0])) {
                    const numExpressionTerms = countTerms(node);
                    if (numExpressionTerms > maxTerms) {
                        context.report({
                            node,
                            messageId: "tooManyTerms",
                            data: {
                                numTerms: numExpressionTerms,
                                maxAllowed: maxTerms
                            }
                        });
                    }
                }
            }
        };
    }
};

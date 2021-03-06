const orderedImportsByPath = require("./lib/rules/ordered-imports-by-path.js");
const orderedImportMembers = require("./lib/rules/ordered-import-members.js");
const strictCamelCase = require("./lib/rules/strict-camel-case.js");
const logicalExpressionComplexity = require("./lib/rules/logical-expression-complexity.js");

module.exports = {
    rules: {
        "ordered-imports-by-path": orderedImportsByPath,
        "ordered-import-members": orderedImportMembers,
        "strict-camel-case": strictCamelCase,
        "logical-expression-complexity": logicalExpressionComplexity
    },
};

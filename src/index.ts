import { addAlias } from "module-alias";

/* global __dirname */

/*
not using _moduleAliases in package.json because:
- we need different aliases for unit tests and runtime
- the value in package.json for this package doens't get picked up by apps importing this package
__dirname == <root>/src
 */

addAlias("@adashrodEps", __dirname);

import logicalExpressionComplexity from "@adashrodEps/lib/rules/logical-expression-complexity";
import orderedDestructuring from "@adashrodEps/lib/rules/ordered-destructuring";
import orderedImportMembers from "@adashrodEps/lib/rules/ordered-import-members";
import orderedImportsByPath from "@adashrodEps/lib/rules/ordered-imports-by-path";
import strictCamelCase from "@adashrodEps/lib/rules/strict-camel-case";

export const rules = {
    "logical-expression-complexity": logicalExpressionComplexity,
    "ordered-destructuring": orderedDestructuring,
    "ordered-import-members": orderedImportMembers,
    "ordered-imports-by-path": orderedImportsByPath,
    "strict-camel-case": strictCamelCase,
};

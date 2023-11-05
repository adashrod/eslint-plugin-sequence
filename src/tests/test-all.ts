import { addAlias } from "module-alias";
/*
not using _moduleAliases in package.json because:
- we need different aliases for unit tests and runtime
- the value in package.json for this package doens't get picked up by apps importing this package
__dirname == <root>/src/tests
 */
addAlias("@adashrodEps",  `${__dirname}/..`);

import "@adashrodEps/tests/rules/ordered-imports-by-path";
import "@adashrodEps/tests/rules/ordered-import-members";
import "@adashrodEps/tests/rules/strict-camel-case";
import "@adashrodEps/tests/rules/logical-expression-complexity";

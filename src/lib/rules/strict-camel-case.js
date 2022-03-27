const { nullishCoalesce } = require("./util/misc-js.js");
const { objectToString } = require("./util/serialization.js");

/**
 * @fileoverview Rule to enforce strict camel case in identifiers
 * @author Aaron Rodriguez
 */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description: "enforce strict camel case, i.e. no all-caps tokens, words, or acronyms in identifiers",
            recommended: false,
            url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/strict-camel-case.md"
        },

        schema: [{
            type: "object",
            properties: {
                ignoreProperties: {
                    type: "boolean",
                    default: false
                },
                ignoreImports: {
                    type: "boolean",
                    default: false
                },
                ignoredIdentifiers: {
                    type: "array",
                    items: [{
                        type: "string"
                    }],
                    minItems: 0,
                    uniqueItems: true
                },
                allowOneCharWords: {
                    type: "string",
                    enum: ["never", "always", "last"],
                    default: "never"
                },
                ignoreSingleWords: {
                    type: "boolean",
                    default: false
                }
            },
            additionalProperties: false
        }],

        messages: {
            notCamelCaseWithSuggestion:
                `Identifier "{{name}}" is not in strict camel case, should be "{{suggestion}}".{{debug}}`,
            notCamelCasePrivateWithSuggestion:
                `"Private member #{{name}}" is not in strict camel case, should be "#{{suggestion}}".{{debug}}`,
            notCamelCaseNoSuggestion:
                `Identifier "{{name}}" is not in strict camel case, no suggestion possible for 1-char words.{{debug}}`,
            notCamelCasePrivateNoSuggestion:
                `"Private member #{{name}}" is not in strict camel case, no suggestion possible for 1-char words.` +
                `{{debug}}`
        }
    },

    create(context) {
        const options = context.options[0] || {},
            ignoreProperties = nullishCoalesce(options.ignoreProperties, false),
            ignoreImports = nullishCoalesce(options.ignoreImports, false),
            ignoredIdentifiers = options.ignoredIdentifiers || [],
            allowOneCharWords = options.allowOneCharWords || "never",
            ignoreSingleWords = nullishCoalesce(options.ignoreSingleWords, false);

        const LOG_RULE_PREFIX = "eslint-plugin-sequence/strict-camel-case ";
        const LEVELS = ["OFF", "FATAL", "ERROR", "WARN", "INFO", "DEBUG", "TRACE"];
        let currentLogLevel; // number

        function log(requestedLevel, ...args) {
            if (args.length > 0 && isLogLevelEnabled(requestedLevel)) {
                const label = LOG_RULE_PREFIX + requestedLevel.padEnd(5);
                if (typeof args[0] === "function") {
                    console.log(label, ...args[0]());
                } else {
                    console.log(label, ...args);
                }
            }
        }

        function isLogLevelEnabled(level) {
            return currentLogLevel >= LEVELS.indexOf(level);
        }

        /**
         * sets the log level
         * @param {string} level log level, see LEVELS
         */
        function setLogLevel(level) {
            currentLogLevel = LEVELS.indexOf(level);
            if (currentLogLevel === -1) {
                throw new Error(`Invalid log level: ${level}`);
            }
        }
        setLogLevel("OFF");

        const alphaPattern = /\p{L}/u;
        const digitPattern = /\d/;
        const underscoreTrimPattern = /^(_*).*?(_*)$/;
        const allCapsSnakeCasePattern = /^[\p{Lu}\d]+(_[\p{Lu}\d]+)+$/u;
        const mixedSnakeCasePattern = /^_*[\p{L}\d]+(_[\p{L}\d]+)+_*$/u;

        /**
         * Returns true if the character is a letter
         *
         * @param {string} c a character
         * @returns boolean
         */
        function isAlpha(c) {
            return alphaPattern.test(c);
        }

        /**
         * @param {string} c any one-character string
         * @return {boolean} true if the character is one of "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
         */
        function isDigit(c) {
            if (c.length !== 1) {
                throw new Error("Argument to isDigit() must be a single-char string");
            }
            return digitPattern.test(c);
        }

        /**
         * @param {string} c any one-character string
         * @return {boolean} true if c is an uppercase letter
         */
        function isUpper(c) {
            if (c.length !== 1) {
                throw new Error("Argument to isUpper() must be a single-char string");
            }
            return isAlpha(c) && c === c.toLocaleUpperCase();
        }

        /**
         * @param {string} s a string
         * @return {boolean} true if s contains only uppercase letters
         */
        function isAllCaps(s) {
            return s.split("").every(isUpper);
        }

        /**
         * @param {string} c any one-character string
         * @return {boolean} true if c is a lowercase letter
         */
        function isLower(c) {
            if (c.length !== 1) {
                throw new Error("Argument to isLower() must be a single-char string");
            }
            return isAlpha(c) && c === c.toLocaleLowerCase();
        }

        /**
         * Converts a string to one with the first letter uppercase and the rest lowercase,
         * e.g. "HELLO"|"hello"|"hElLo" -> "Hello"
         *
         * @param {string} s a string
         * @returns s with the first letter uppercase and the rest lowercase
         */
        function capitalize(s) {
            return s.charAt(0).toLocaleUpperCase() + s.slice(1).toLocaleLowerCase();
        }

        /**
         * Parses a string that's in strict (e.g. htmlToXml) or invalid camel case (e.g. XMLHttpRequest), splitting it
         * into an array of tokens, e.g.
         * "htmlToXml" -> ["html", "To", "Xml"]
         * "HTMLToXML" -> ["HTML", "To", "XML"]
         * "XMLHttpRequest" -> ["XML", "Http", "Request"]
         * Note: leading underscores are treated as being part of the first token if the first non-underscore char is
         * lowercase and separate if the first non-underscore char is uppercase or a digit
         * "_xmlThing" -> ["_xml", "Thing"]
         * "_XmlThing" -> ["_", "Xml", "Thing"]
         * "_XMLThing" -> ["_", "XML", "Thing"]
         * "_3PieceChicken" -> ["_", "3", "Piece", "Chicken"]
         * Note: groups of digits are considered as part of a token of subsequent letters if the first subsequent letter
         * is lowercase, and separate if the first subsequent letter is uppercase, e.g.
         * "The5Tenets" -> ["The", "5", "Tenets"]
         * "The5thElement" -> ["The", "5th", "Element"]
         * "HTML5Tags" -> ["HTML", "5", "Tags"]
         * "HTML5thVersion" -> ["HTML", "5th", "Version"]
         *
         * @param {string} s a string that's in camel case, strict (e.g. htmlToXml) or invalid (e.g. XMLHttpRequest)
         * @returns array of tokens
         */
        function tokenizeInvalidCamelCase(s) {
            const result = [];
            let tokenStart = 0;
            let capturingAllCapsToken = false;
            for (let i = 0; i < s.length; i++) {
                const lastWasUpper = i !== 0 && isUpper(s.charAt(i - 1));
                const lastWasDigit = i !== 0 && isDigit(s.charAt(i - 1));
                const c = s.charAt(i);
                if (isUpper(c) && lastWasUpper) {
                    capturingAllCapsToken = true;
                } else if (isUpper(c) && !capturingAllCapsToken && i !== 0) {
                    // start of new token
                    result.push(s.substring(tokenStart, i));
                    tokenStart = i;
                    capturingAllCapsToken = false;
                } else if (isLower(c) && capturingAllCapsToken) {
                    // finished capturing all caps token; found 2nd char of next token
                    result.push(s.substring(tokenStart, i - 1));
                    tokenStart = i - 1;
                    capturingAllCapsToken = false;
                } else if (isDigit(c) && !lastWasDigit) {
                    // finished capturing token; found 1st char of numeric token
                    result.push(s.substring(tokenStart, i));
                    tokenStart = i;
                    capturingAllCapsToken = false;
                }
            }
            result.push(s.substring(tokenStart, s.length));
            return result;
        }

        /**
         * Parses a string that's in snake case, in which the letters are any mix of uppercase and lowercase.
         * Underscores between words are treated as delimiters and are removed. Leading and trailing underscores are
         * preserved and are returned as tokens, e.g.
         * "_xml_Thing" -> ["_", "xml", "Thing"]
         * "xml__thing" -> ["xml", "thing"]
         * "_a_deadly_snake__" -> ["_", "a", "deadly", "snake", "__"]
         * No special meaning is given to any patterns of uppercase, lowercase, and digits between underscore delimiters
         *
         * @param {string} s a string in snake case
         * @returns array of tokens
         */
        function tokenizeMixedSnakeCase(s) {
            const underscorePaddingMatch = s.match(underscoreTrimPattern);
            const leadingUnderscores = underscorePaddingMatch.length >= 2 && underscorePaddingMatch[1] || "";
            const trailingUnderscores = underscorePaddingMatch.length >= 3 && underscorePaddingMatch[2] || "";
            const tokens = s.split(/_+/).filter(token => token.length);
            if (leadingUnderscores) {
                tokens.unshift(leadingUnderscores);
            }
            if (trailingUnderscores) {
                tokens.push(trailingUnderscores);
            }
            return tokens;
        }

        /**
         * Returns true if the string is all-caps snake case, e.g. "THIS_IS_A_CONSTANT"
         *
         * @param {string} s a string
         * @returns boolean
         */
        function isAllCapsSnakeCase(s) {
            return allCapsSnakeCasePattern.test(s);
        }

        /**
         * Returns true if the string is snake case. There are no restrictions on uppercase or lowercase letters.
         * Leading and trailing underscores are valid. There must be at least one underscore (i.e. two words) to be
         * considered snake case.
         *
         * @param {string} s a string
         * @returns true if the string is snake case, e.g. "this_is_snake_Case"
         */
        function isMixedSnakeCase(s) {
            return mixedSnakeCasePattern.test(s);
        }

        /**
         * Checks that the given string is in strict camel case. If it is, the return value will contain the property
         * `valid: true`. If it's not in strict camel case, valid will be false. If valid is false, the result might
         * also contain a suggested replacement in the `suggestion` property, e.g.
         *
         * check("XMLToHTML") -> { valid: false, suggestion: "XmlToHtml" }
         * check("XmlToHtml") -> { valid: true, suggestion: null }
         *
         * Note: the value of the configs `ignoreSingleWords` and `allowOneCharWords` affect the results.
         * with `ignoreSingleWords=true`
         * check("HTML") -> { valid: true, suggestion: null }
         * with `ignoreSingleWords=false`
         * check("HTML") -> { valid: false, suggestion: "Html" }
         *
         * with `allowOneCharWords="never"`
         * check("AClass") -> { valid: false, suggestion: null } // suggestion not possible
         * check("getX") -> { valid: false, suggestion: null } // suggestion not possible
         * with `allowOneCharWords="last"`
         * check("AClass") -> { valid: false, suggestion: null } // suggestion not possible
         * check("getX") -> { valid: true, suggestion: null } // 1-letter words allowed as the last
         * with `allowOneCharWords="always"`
         * check("AClass") -> { valid: true, suggestion: null }
         * check("getX") -> { valid: true, suggestion: null }
         *
         * @param {string} s an identifier string
         * @returns an object with 2 keys: valid and suggestion
         */
        function checkValidityAndGetSuggestion(s) {
            let valid = false;
            let tokens = [];
            if (ignoredIdentifiers.includes(s)) {
                valid = true;
            } else if (isAllCaps(s) && ignoreSingleWords) {
                // ignoreSingleWords=true means treat "HTML" as a constant, not invalid camel case
                log("TRACE", `skipping ambiguous "${s}" due to ignoreSingleWords=true`);
                valid = true;
            } else if (isAllCapsSnakeCase(s)) {
                // constants like THIS_IS_A_CONSTANT
                log("TRACE", `skipping all-caps snake case "${s}"`);
                valid = true;
            } else if (isMixedSnakeCase(s)) {
                // definitely invalid because snake case is not allowed under this rule
                log("TRACE", `tokenizing "${s}" as snake case`);
                tokens = tokenizeMixedSnakeCase(s);
                const firstWordTokenIndex = /^_+$/.test(tokens[0]) ? 1 : 0;
                if (firstWordTokenIndex < tokens.length) {
                    if (isUpper(tokens[firstWordTokenIndex].charAt(0))) {
                        tokens[firstWordTokenIndex] = capitalize(tokens[firstWordTokenIndex]);
                    } else {
                        tokens[firstWordTokenIndex] = tokens[firstWordTokenIndex].toLocaleLowerCase();
                    }
                    for (let i = firstWordTokenIndex + 1; i < tokens.length; i++) {
                        tokens[i] = capitalize(tokens[i]);
                    }
                }
            } else {
                log("TRACE", `tokenizing "${s}" as camel case`)
                tokens = tokenizeInvalidCamelCase(s);
                const invalidIndexes = [];
                tokens.forEach((token, i) => {
                    if (isAllCaps(token)) {
                        if (token.length > 1 || allowOneCharWords === "never") {
                            invalidIndexes.push(i);
                        } else if (allowOneCharWords === "last" &&
                                // one-char word is last word
                                !(i + 1 === tokens.length ||
                                    // one-char word is last word before trailing underscores
                                    (i + 2 === tokens.length && tokens[tokens.length - 1].match(/^_+$/)))) {
                            invalidIndexes.push(i);
                        }
                        // token.length === 1 && allowOneCharWords === "always" -> valid token
                    }
                });
                if (!invalidIndexes.length) {
                    valid = true;
                }
                invalidIndexes.forEach(index => tokens[index] = capitalize(tokens[index]));
            }
            const joined = tokens.join("");
            return {
                suggestion: joined !== s ? joined : null,
                valid
            }
        }

        // keep track of reported tokens to not report twice
        const reported = new Set();

        function buildNodePath(node) {
            const path = [];
            let n = node;
            while (n !== null) {
                path.unshift(n.type);
                n = n.parent;
            }
            return path.join(" > ");
        }

        /**
         * Reports an AST node as a rule violation.
         * @param {AstNode} node The node to report.
         * @private
         */
        function report(node, suggestion, debugMsg) {
            if (reported.has(node.range[0])) {
                log("DEBUG", `skipping reporting ${buildNodePath(node)} "${node.name}": already reported`);
                return;
            }
            reported.add(node.range[0]);

            let messageId;
            if (node.type === "PrivateIdentifier") {
                messageId = suggestion ? "notCamelCasePrivateWithSuggestion" : "notCamelCasePrivateNoSuggestion";
            } else {
                messageId = suggestion ? "notCamelCaseWithSuggestion" : "notCamelCaseNoSuggestion";
            }

            log("DEBUG", `reporting ${buildNodePath(node)} "${node.name}"`);
            context.report({
                node,
                messageId,
                data: {
                    name: node.name,
                    suggestion,
                    debug: isLogLevelEnabled("DEBUG") ? ` (${debugMsg} ${buildNodePath(node)})` : ""
                }
            });
        }

        function checkGlobals() {
            const scope = context.getScope();

            for (const variable of scope.variables) {
                const response = checkValidityAndGetSuggestion(variable.name);
                // these are global variables. built-in global vars have no identifiers or defs
                // in ecmaVersion <= 5, this catches implicit globals `var xyz = 5` outside of any function scope
                // > 6 scope.variables is only built-ins
                if (!variable.identifiers.length || response.valid) {
                    log("TRACE", `Program: PASS variable.name=${variable.name}`);
                    continue;
                }
                for (const reference of variable.references) {
                    log("TRACE", () => [`Program: reporting reference ${variable.name}`, objectToString(reference)]);
                    report(reference.identifier, response.suggestion, "Program: scope.variables[].references[]");
                }
            }

            for (const reference of scope.through) {
                const identifier = reference.identifier;
                const response = checkValidityAndGetSuggestion(identifier.name);
                if (response.valid) {
                    continue;
                }
                log("TRACE", () => [`Program: reporting through reference reference.identifier.name=${identifier.name}`,
                    objectToString(reference)]);
                report(identifier, response.suggestion, "Program: scope.through[].identifier");
            }
        }

        function checkDeclarations(node) {
            for (const variable of context.getDeclaredVariables(node)) { // funcName+params, mult var decl in one stmt
                log("DEBUG", `*Declaration checking variable.name=${variable.name}`);
                const response = checkValidityAndGetSuggestion(variable.name);
                if (response.valid) {
                    log("TRACE", `*Declaration: PASS variable.name=${variable.name}`);
                    continue;
                }
                const identifier = variable.identifiers[0];
                log("TRACE", () => [`*Declaration: reporting variable ${variable.name}`, objectToString(variable)]);
                report(identifier, response.suggestion, "*Declaration:");

                // references to vars after declaration
                for (const reference of variable.references) {
                    if (reference.init) { // boolean
                        // this is a reference to the var initialization, but the name was already checked at the top
                        // of the outer loop, so skip
                        continue;
                    }
                    // other references, could be 2nd, 3rd, etc assignments, or on RHS of expressions
                    log("TRACE", () => [`*Declaration: reporting reference ${node.name}`, objectToString(reference)]);
                    report(reference.identifier, response.suggestion, "*Declaration reference:");
                }
            }
        }

        function checkClassFieldsMethodsAndObjectFieldsMethods(node) {
            if (!ignoreProperties) {
                log("DEBUG", `class/object field/method declarations checking ${node.name}`);
                const response = checkValidityAndGetSuggestion(node.name);
                if (!response.valid) {
                    log("TRACE", () => [`Field/method declarations reporting ${node.name}`, objectToString(node)]);
                    report(node, response.suggestion, "Field/method declarations");
                } else {
                    log("TRACE", `field/method declarations: PASS node.name=${node.name}`);
                }
            } else {
                log("TRACE", `field/method declarations skipping node.name=${node.name} due to config`);
            }
        }

        function checkImportDeclarations(node) {
            if (!ignoreImports) {
                for (const variable of context.getDeclaredVariables(node)) {
                    log("DEBUG", `ImportDeclaration checking ${variable.name}`);
                    const response = checkValidityAndGetSuggestion(variable.name);
                    if (response.valid) {
                        log("TRACE", `ImportDeclaration: PASS variable.name=${variable.name}`);
                        continue;
                    }
                    const identifier = variable.identifiers[0];

                    if (["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(identifier.parent.type)) {
                        log("TRACE", () => [
                            `ImportDefaultSpecifier/ImportNamespaceSpecifier reporting ${variable.name}`,
                            objectToString(identifier)
                        ]);
                        report(identifier, response.suggestion, "ImportDefaultSpec/ImportNamespaceSpecifier");
                    } else if (identifier.name !== identifier.parent.imported.name) {
                        log("TRACE", () => [`ImportDeclaration reporting named import ${variable.name}`,
                        objectToString(identifier)]);
                        report(identifier, response.suggestion, "Import");
                    } else {
                        // for non-renamed non-default imports (`import { htmlToXML } from "..."`),
                        // identifier === identifier.parent.imported
                        log("DEBUG", `skipping references to import "${identifier.name}" with invalid name`);
                        continue;
                    }

                    for (const reference of variable.references) {
                        log("TRACE", () => [`ImportDeclaration reporting ${variable.name}`, objectToString(reference)]);
                        report(reference.identifier, response.suggestion, "ImportDeclaration reference");
                    }
                }
            }
        }

        function checkExportsAndLabels(node) {
            log("DEBUG", `export/label checking ${node.name}`);
            const response = checkValidityAndGetSuggestion(node.name);
            if (!response.valid) {
                log("TRACE", () => [`export/label reporting ${node.name}`, objectToString(node)]);
                report(node, response.suggestion, "export/label/break/continue");
            } else {
                log("TRACE", `export/label: PASS ${node.name}`);
            }
        }

        return {
            Program: checkGlobals,

            ArrowFunctionExpression: checkDeclarations,
            CatchClause: checkDeclarations,
            ClassDeclaration: checkDeclarations,
            ClassExpression: checkDeclarations,
            TSInterfaceDeclaration: checkDeclarations,
            TSEnumDeclaration: checkDeclarations,
            FunctionDeclaration: checkDeclarations,
            FunctionExpression: checkDeclarations,
            VariableDeclaration: checkDeclarations,

            // ---object literals---
            "ObjectExpression > Property > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // ---instance functions on classes---
            "MethodDefinition > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // ---TS-only: class instance props---
            "PropertyDefinition > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // class { #privPropName = ...; }
            "MethodDefinition > PrivateIdentifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // class { #privFunc() {...} }
            "PropertyDefinition > PrivateIdentifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // ---class props `this.xyz = ...`, `window.abc = ...`---
            "MemberExpression > Identifier.property": checkClassFieldsMethodsAndObjectFieldsMethods,
            // TS interface fields
            "TSInterfaceDeclaration > TSInterfaceBody > TSPropertySignature > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // TS interface methods
            "TSInterfaceDeclaration > TSInterfaceBody > TSMethodSignature > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
            // TS enum members
            "TSEnumDeclaration > TSEnumMember > Identifier.id": checkClassFieldsMethodsAndObjectFieldsMethods,

            ImportDeclaration: checkImportDeclarations,

            "ExportAllDeclaration > Identifier.exported": checkExportsAndLabels,
            "ExportSpecifier > Identifier.exported": checkExportsAndLabels,
            "LabeledStatement > Identifier.label": checkExportsAndLabels,
            "BreakStatement > Identifier.label": checkExportsAndLabels,
            "ContinueStatement > Identifier.label": checkExportsAndLabels,
        };
    }
};

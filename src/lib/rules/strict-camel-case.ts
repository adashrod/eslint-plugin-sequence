import type { Rule } from "eslint";
import type {
    Identifier,
    ImportDeclaration,
    ImportSpecifier,
    PrivateIdentifier,
    PropertyDefinition,
    VariableDeclaration,
} from "estree";
import console from "node:console";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";
import { objectToString } from "@adashrodEps/lib/rules/util/serialization";
import {
    capitalize,
    isAllCaps,
    isAllCapsAndDigits,
    isAllCapsSnakeCase,
    isMixedSnakeCase,
    isUpper,
    tokenizeMixedSnakeCase,
    tokenizePotentiallyInvalidCamelCase,
} from "@adashrodEps/lib/rules/util/strings";

/**
 * @fileoverview Rule to enforce strict camel case in identifiers
 * @author Aaron Rodriguez
 */

enum AllowOneCharWords {
    NEVER = "never",
    ALWAYS = "always",
    LAST = "last",
}

enum IgnoreSingleWordsIn {
    ENUM_MEMBER = "enum_member",
    FIRST_CLASS_CONSTANT = "first_class_constant",
    OBJECT_FIELD = "object_field",
    STATIC_CLASS_FIELD = "static_class_field",
}

type Config = {
    ignoreImports: boolean;
    ignoredIdentifiers: string[];
    allowOneCharWords: AllowOneCharWords;
    ignoreSingleWordsIn: IgnoreSingleWordsIn[]
};

const DEFAULT_PROPERTIES: Config = {
    ignoreImports: false,
    ignoredIdentifiers: [],
    allowOneCharWords: AllowOneCharWords.NEVER,
    ignoreSingleWordsIn: [],
};

const meta: Rule.RuleMetaData = {
    type: "suggestion",

    docs: {
        description: "enforce strict camel case, i.e. no all-caps tokens, words, or acronyms in identifiers",
        recommended: false,
        url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/strict-camel-case.md",
    },

    schema: [{
        type: "object",
        properties: {
            ignoreImports: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.ignoreImports,
            },
            ignoredIdentifiers: {
                type: "array",
                items: [{
                    type: "string",
                }],
                minItems: 0,
                uniqueItems: true,
                default: DEFAULT_PROPERTIES.ignoredIdentifiers,
            },
            allowOneCharWords: {
                type: "string",
                enum: [
                    AllowOneCharWords.NEVER,
                    AllowOneCharWords.ALWAYS,
                    AllowOneCharWords.LAST,
                ],
                default: DEFAULT_PROPERTIES.allowOneCharWords,
            },
            ignoreSingleWordsIn: {
                type: "array",
                items: {
                    enum: [
                        IgnoreSingleWordsIn.ENUM_MEMBER,
                        IgnoreSingleWordsIn.FIRST_CLASS_CONSTANT,
                        IgnoreSingleWordsIn.OBJECT_FIELD,
                        IgnoreSingleWordsIn.STATIC_CLASS_FIELD,
                    ],
                },
                minItems: 0,
                uniqueItems: true,
                default: DEFAULT_PROPERTIES.ignoreSingleWordsIn,
            },
        },
        additionalProperties: false,
    }],

    hasSuggestions: true,

    messages: {
        notCamelCaseWithSuggestion:
            `Identifier "{{name}}" is not in strict camel case, should be "{{suggestion}}".{{debug}}`,
        notCamelCasePrivateWithSuggestion:
            `Private member "#{{name}}" is not in strict camel case, should be "#{{suggestion}}".{{debug}}`,
        notCamelCaseNoSuggestion:
            `Identifier "{{name}}" is not in strict camel case, no suggestion possible for 1-char words.{{debug}}`,
        notCamelCasePrivateNoSuggestion:
            `Private member "#{{name}}" is not in strict camel case, no suggestion possible for 1-char words.` +
            `{{debug}}`,
        suggestionMessage: `Replace "{{name}}" with "{{suggestion}}"`,
    },
};

enum LogLevel {
    OFF = "OFF",
    FATAL = "FATAL",
    ERROR = "ERROR",
    WARN = "WARN",
    INFO = "INFO",
    DEBUG = "DEBUG",
    TRACE = "TRACE",
}

const ORDERED_LOG_LEVELS = [
    LogLevel.OFF,
    LogLevel.FATAL,
    LogLevel.ERROR,
    LogLevel.WARN,
    LogLevel.INFO,
    LogLevel.DEBUG,
    LogLevel.TRACE,
];

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        sourceCode = context.sourceCode;

    let currentLogLevel: LogLevel;

    function log(requestedLevel: LogLevel, ...args: string[] | (() => string[])[]): void {
        if (args.length > 0 && isLogLevelEnabled(requestedLevel)) {
            const label = `${context.id} ${requestedLevel.padEnd(5)}`;
            if (typeof args[0] === "function") {
                console.log(label, ...args[0]());
            } else {
                console.log(label, ...args);
            }
        }
    }

    function isLogLevelEnabled(level: LogLevel): boolean {
        // todo: maybe optimize this
        return ORDERED_LOG_LEVELS.indexOf(currentLogLevel) >= ORDERED_LOG_LEVELS.indexOf(level);
    }

    /**
     * sets the log level
     * @param level log level, see LEVELS
     */
    function setLogLevel(level: LogLevel): void {
        currentLogLevel = level;
    }
    setLogLevel(LogLevel.OFF);

    function isDisallowedOneCharToken(index: number, tokens: string[]): boolean {
        const is1CharToken = tokens[index].length === 1;
        const isLastToken =
            // one-char word is last word
            index + 1 === tokens.length ||
            // one-char word is last word before trailing underscores
            (index + 2 === tokens.length && tokens[tokens.length - 1].match(/^_+$/) !== null);
        return is1CharToken && cfg.allowOneCharWords === "last" && !isLastToken;
    }

    /**
     * Checks that the given string is in strict camel case. If it is, the return value will contain the property
     * `valid: true`. If it's not in strict camel case, valid will be false. If valid is false, the result might
     * also contain a suggested replacement in the `suggestion` property, e.g.
     *
     * check("XMLToHTML") -> { valid: false, suggestion: "XmlToHtml" }
     * check("XmlToHtml") -> { valid: true, suggestion: null }
     *
     * Note: the value of the configs `ignoreSingleWordsIn`, and `allowOneCharWords` affect the results.
     * with code `class HTML {}`, ignoreAllCapsIfSingleWord is false because this context is not one for constants
     * check("HTML", false) -> { valid: false, suggestion: "Html" }
     * with `ignoreSingleWordsIn=["first_class_constant"]` and code `const VERSION = "1.0"`,
     *     ignoreAllCapsIfSingleWord is true
     * check("VERSION", true) -> { valid: true, suggestion: null }
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
     * @param s an identifier string
     * @param ignoreAllCapsIfSingleWord if true, interpret s as a constant
     * @returns an object with 2 keys: valid and suggestion
     */
    function checkValidityAndGetSuggestion(s: string, ignoreAllCapsIfSingleWord: boolean = false): {
        valid: boolean,
        suggestion: string | null
    } {
        let valid = false;
        let tokens: string[] = [];
        if (cfg.ignoredIdentifiers.includes(s)) {
            valid = true;
        } else if (isAllCapsAndDigits(s) && ignoreAllCapsIfSingleWord) {
            // using isAllCapsAndDigits and not isAllCaps to allow one-word names like "HTML5". This is a slight
            // deviation from the tokenization behavior in that tokenize() still treats "HTML5" as two tokens, but
            // fixing that tokenization to match this wouldn't affect the suggestions and the tokens aren't exposed
            // to the user, so it's unimportant.
            // ignoreAllCapsIfSingleWord=true means treat "HTML" as a constant because the current context is
            // interpreted as "constants"
            log(LogLevel.TRACE, `skipping ambiguous "${s}" due to ignorSingleWordsIn config`);
            valid = true;
        } else if (isAllCapsSnakeCase(s)) {
            // constants like THIS_IS_A_CONSTANT
            log(LogLevel.TRACE, `skipping all-caps snake case "${s}"`);
            valid = true;
        } else if (isMixedSnakeCase(s)) {
            // definitely invalid because snake case is not allowed under this rule
            log(LogLevel.TRACE, `tokenizing "${s}" as snake case`);
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
            log(LogLevel.TRACE, `tokenizing "${s}" as camel case`);
            tokens = tokenizePotentiallyInvalidCamelCase(s);
            const invalidIndexes: number[] = [];
            tokens.forEach((token, i) => {
                if (isAllCaps(token)) {
                    const isMultiCharToken = token.length > 1;
                    if (
                        isMultiCharToken ||
                        cfg.allowOneCharWords === "never" ||
                        isDisallowedOneCharToken(i, tokens)
                    ) {
                        invalidIndexes.push(i);
                    }
                    // token.length === 1 && allowOneCharWords === "always" -> valid token
                }
            });
            if (invalidIndexes.length === 0) {
                valid = true;
            }
            invalidIndexes.forEach(index => tokens[index] = capitalize(tokens[index]));
        }
        const joined = tokens.join("");
        return {
            suggestion: ![s, ""].includes(joined)  ? joined : null,
            valid,
        };
    }

    /**
     * For certain cases, a selector meant to catch declarations will catch the right-hand side, but should not lint in
     * that case.
     * e.g.
     * this.VERSION = "1.0"; // not exempt
     * this.type = FileTypes.TXT; // exempt because it's referencing something that is declared elsewhere
     * @param node an identifier node
     * @returns true if the name should be exempt
     */
    function isExemptAssignment(node: (Identifier | PrivateIdentifier) & Rule.NodeParentExtension): boolean {
        const memberExpression = node.parent;
        if (memberExpression.type === "MemberExpression") {
            const assignmentExpression = memberExpression.parent;
            if (assignmentExpression.type === "AssignmentExpression" && assignmentExpression.right === memberExpression) {
                return true;
            }
        }
        return false;
    }

    // keep track of reported tokens to not report twice
    const reported = new Set<number>();

    function buildNodePath(node: Rule.Node): string {
        const path: unknown[] = [];
        let n = node;
        while (n !== null && n !== undefined) {
            path.unshift(n.type);
            n = n.parent;
        }
        return path.join(" > ");
    }

    /**
     * Reports an AST node as a rule violation.
     * @param node        The node to report
     * @param suggestion  suggested replacement, null if none possible
     * @param debugMsg    message that gets appended to the error if debug logging is enabled
     */
    function report(node: Identifier | PrivateIdentifier, suggestion: string | null, debugMsg: string): void {
        if (!node.range) {
            return;
        }
        // some of the Identifiers passed to report() come from APIs that are defined in estree and don't have unions
        // with Rule.NodeParentExtension (defined in eslint), and yet, at runtime, they all have the parent property
        const nodeWithParent = node as Rule.Node;
        if (reported.has(node.range[0])) {
            log(LogLevel.DEBUG, `skipping reporting ${buildNodePath(nodeWithParent)} "${node.name}": already reported`);
            return;
        }
        reported.add(node.range[0]);

        let messageId;
        let optionalPrivatePrefix = "";
        if (node.type === "PrivateIdentifier") {
            messageId = suggestion !== null ? "notCamelCasePrivateWithSuggestion" : "notCamelCasePrivateNoSuggestion";
            optionalPrivatePrefix = "#";
        } else {
            messageId = suggestion !== null ? "notCamelCaseWithSuggestion" : "notCamelCaseNoSuggestion";
        }

        log(LogLevel.DEBUG, `reporting ${buildNodePath(nodeWithParent)} "${node.name}"`);
        context.report({
            node,
            messageId,
            data: {
                name: node.name,
                suggestion: suggestion ?? "",
                debug: isLogLevelEnabled(LogLevel.DEBUG) ? ` (${debugMsg} ${buildNodePath(nodeWithParent)})` : "",
            },
            suggest: suggestion !== null ? [{
                messageId: "suggestionMessage",
                data: {
                    name: node.name,
                    suggestion: suggestion ?? "",
                },
                fix(fixer: Rule.RuleFixer): Rule.Fix {
                    return fixer.replaceTextRange(node.range!, optionalPrivatePrefix + suggestion);
                },
            }] : null,
        });
    }

    function checkDeclarations(node: Rule.Node, singleWordExemptionType?: IgnoreSingleWordsIn): void {
        for (const variable of sourceCode.getDeclaredVariables(node)) { // funcName+params, mult var decl in one stmt
            log(LogLevel.DEBUG, `*Declaration checking variable.name=${variable.name}`);
            const { suggestion, valid } = checkValidityAndGetSuggestion(variable.name,
                cfg.ignoreSingleWordsIn.includes(singleWordExemptionType as IgnoreSingleWordsIn));
            if (valid) {
                log(LogLevel.TRACE, `*Declaration: PASS variable.name=${variable.name}`);
                continue;
            }
            const identifier = variable.identifiers[0];
            log(LogLevel.TRACE, () => [`*Declaration: reporting variable ${variable.name}`, objectToString(variable)]);
            report(identifier, suggestion, "*Declaration:");

            // references to vars after declaration
            for (const reference of variable.references) {
                if (reference.init) {
                    // this is a reference to the var initialization, but the name was already checked at the top
                    // of the outer loop, so skip
                    continue;
                }
                // other references, could be 2nd, 3rd, etc assignments, or on RHS of expressions
                log(LogLevel.TRACE, () => [
                    `*Declaration: reporting reference ${variable.name}`,
                    objectToString(reference)]);
                report(reference.identifier, suggestion, "*Declaration reference:");
            }
        }
    }

    function checkClassFieldsMethodsAndObjectFieldsMethods(
        node: (Identifier | PrivateIdentifier) & Rule.NodeParentExtension,
        singleWordExemptionType?: IgnoreSingleWordsIn
    ): void {
        if (isExemptAssignment(node)) {
            log(LogLevel.TRACE, `skipping object property in RHS of assignment expression`);
            return;
        }
        log(LogLevel.DEBUG, `class/object field/method declarations checking ${node.name}`);
        const { suggestion, valid } = checkValidityAndGetSuggestion(node.name,
            cfg.ignoreSingleWordsIn.includes(singleWordExemptionType as IgnoreSingleWordsIn));
        if (!valid) {
            log(LogLevel.TRACE, () => [`Field/method declarations reporting ${node.name}`, objectToString(node)]);
            report(node, suggestion, "Field/method declarations");
        } else {
            log(LogLevel.TRACE, `field/method declarations: PASS node.name=${node.name}`);
        }
    }

    function checkClassFields(node: Identifier & Rule.NodeParentExtension): void {
        const propDef = node.parent as PropertyDefinition;
        checkClassFieldsMethodsAndObjectFieldsMethods(
            node, propDef.static ? IgnoreSingleWordsIn.STATIC_CLASS_FIELD : undefined);
    }

    function checkImportDeclarations(node: ImportDeclaration & Rule.NodeParentExtension): void {
        function badlyAliasedImport(identifier: Identifier & Rule.NodeParentExtension): boolean {
            const idName = identifier.name;
            const importSpecifierParent = identifier.parent as ImportSpecifier;
            if (importSpecifierParent.imported.type === "Identifier") {
                return idName !== importSpecifierParent.imported.name;
            }
            return false;
        }
        if (!cfg.ignoreImports) {
            for (const variable of sourceCode.getDeclaredVariables(node)) {
                log(LogLevel.DEBUG, `ImportDeclaration checking ${variable.name}`);
                const { suggestion, valid } = checkValidityAndGetSuggestion(variable.name);
                if (valid) {
                    log(LogLevel.TRACE, `ImportDeclaration: PASS variable.name=${variable.name}`);
                    continue;
                }
                const identifier = variable.identifiers[0] as (Identifier & Rule.NodeParentExtension);

                if (["ImportDefaultSpecifier", "ImportNamespaceSpecifier"].includes(identifier.parent.type)) {
                    log(LogLevel.TRACE, () => [
                        `ImportDefaultSpecifier/ImportNamespaceSpecifier reporting ${variable.name}`,
                        objectToString(identifier),
                    ]);
                    report(identifier, suggestion, "ImportDefaultSpec/ImportNamespaceSpecifier");
                } else if (badlyAliasedImport(identifier)) {
                    log(LogLevel.TRACE, () => [`ImportDeclaration reporting named import ${variable.name}`,
                        objectToString(identifier)]);
                    report(identifier, suggestion, "Import");
                } else {
                    // for non-renamed non-default imports (`import { htmlToXML } from "..."`),
                    // identifier === identifier.parent.imported
                    log(LogLevel.DEBUG, `skipping references to import "${identifier.name}" with invalid name`);
                    continue;
                }

                for (const reference of variable.references) {
                    log(LogLevel.TRACE, () => [
                        `ImportDeclaration reporting ${variable.name}`,
                        objectToString(reference)]);
                    report(reference.identifier, suggestion, "ImportDeclaration reference");
                }
            }
        }
    }

    function checkSimpleNodeName(node: Identifier & Rule.NodeParentExtension): void {
        log(LogLevel.DEBUG, `export/label/nodeName checking ${node.name}`);
        const { suggestion, valid } = checkValidityAndGetSuggestion(node.name);
        if (!valid) {
            log(LogLevel.TRACE, () => [`export/label/nodeName reporting ${node.name}`, objectToString(node)]);
            report(node, suggestion, "export/label/break/continue/nodeName");
        } else {
            log(LogLevel.TRACE, `export/label/nodeName: PASS ${node.name}`);
        }
    }

    return {
        ArrowFunctionExpression: checkDeclarations,
        CatchClause: checkDeclarations,
        ClassDeclaration: checkDeclarations,
        ClassExpression: checkDeclarations,
        "TSInterfaceDeclaration > Identifier.id": checkSimpleNodeName,
        "TSEnumDeclaration > Identifier": checkSimpleNodeName,
        FunctionDeclaration: checkDeclarations,
        FunctionExpression: checkDeclarations,
        VariableDeclaration: (node: VariableDeclaration & Rule.NodeParentExtension): void => {
            checkDeclarations(node, node.kind === "const" ? IgnoreSingleWordsIn.FIRST_CLASS_CONSTANT : undefined);
        },

        // ---object literals---
        "ObjectExpression > Property > Identifier.key": (node: Identifier & Rule.NodeParentExtension): void => {
            checkClassFieldsMethodsAndObjectFieldsMethods(node, IgnoreSingleWordsIn.OBJECT_FIELD);
        },
        // ---instance functions on classes---
        "MethodDefinition > Identifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
        // ---TS-only: class instance and static props---
        "PropertyDefinition > Identifier.key": checkClassFields,
        // class { #privFunc() {...} }
        "MethodDefinition > PrivateIdentifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
        // class { #privPropName = ...; }
        "PropertyDefinition > PrivateIdentifier.key": checkClassFieldsMethodsAndObjectFieldsMethods,
        // ---private class props, defined at assignment `this.#xyz = ...`---
        "AssignmentExpression > MemberExpression > PrivateIdentifier.property":
            checkClassFieldsMethodsAndObjectFieldsMethods,
        // ---class props `this.xyz = ...`, `window.abc = ...`---
        "AssignmentExpression > MemberExpression > Identifier.property":
            (node: Identifier & Rule.NodeParentExtension): void => {
                checkClassFieldsMethodsAndObjectFieldsMethods(node, IgnoreSingleWordsIn.OBJECT_FIELD);
            },
        // TS interface fields
        "TSInterfaceDeclaration > TSInterfaceBody > TSPropertySignature > Identifier.key":
            checkClassFieldsMethodsAndObjectFieldsMethods,
        // TS interface methods
        "TSInterfaceDeclaration > TSInterfaceBody > TSMethodSignature > Identifier.key":
            checkClassFieldsMethodsAndObjectFieldsMethods,
        "TSTypeAliasDeclaration > TSTypeLiteral > TSPropertySignature > Identifier.key":
            checkClassFieldsMethodsAndObjectFieldsMethods,
        // TS enum members
        // note to self: astexplorer does not identify TSEnumBody below TSEnumDeclaration
        "TSEnumDeclaration TSEnumMember > Identifier": (node: Identifier & Rule.NodeParentExtension): void => {
            checkClassFieldsMethodsAndObjectFieldsMethods(node, IgnoreSingleWordsIn.ENUM_MEMBER);
        },

        ImportDeclaration: checkImportDeclarations,

        "ExportAllDeclaration > Identifier.exported": checkSimpleNodeName,
        "ExportSpecifier > Identifier.exported": checkSimpleNodeName,
        "LabeledStatement > Identifier.label": checkSimpleNodeName,
        "BreakStatement > Identifier.label": checkSimpleNodeName,
        "ContinueStatement > Identifier.label": checkSimpleNodeName,
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

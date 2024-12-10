import type { AST as Ast, Rule } from "eslint";
import type { ImportDeclaration, Program } from "estree";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";

type Config = {
    ignoreCase: boolean;
    allowSeparateGroups: boolean;
    sortSideEffectsFirst: boolean;
    sortTypeImportsFirst: boolean | undefined;
}

const DEFAULT_PROPERTIES: Config = {
    ignoreCase: false,
    allowSeparateGroups: true,
    sortSideEffectsFirst: false,
    sortTypeImportsFirst: undefined
};

/**
 * @fileoverview Rule to enforce ordering of imports by path
 * @author Aaron Rodriguez
 */
const meta: Rule.RuleMetaData = {
    type: "suggestion",

    docs: {
        description:
            "enforce sorted import declarations, sorting imports by path",
        recommended: false,
        url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-imports-by-path.md"
    },

    schema: [{
        type: "object",
        properties: {
            ignoreCase: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.ignoreCase
            },
            allowSeparateGroups: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.allowSeparateGroups
            },
            sortSideEffectsFirst: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.sortSideEffectsFirst
            },
            sortTypeImportsFirst: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.sortTypeImportsFirst
            }
        },
        additionalProperties: false
    }],

    fixable: "code",

    messages: {
        sortSideEffectsFirst: "Sort side-effects-only modules before others." +
            "`{{declarationA}}` should come before `{{declarationB}}`",
        sortImportsByPath:
            "Sort imports alphabetically by path. `{{declarationA}}` should come before `{{declarationB}}`",
        sortTypeImports:
            "Type imports should be sorted {{typeStyle}} value imports. " +
            "`{{declarationA}}` should come before `{{declarationB}}`",
    }
};

type TypeCapableImportDeclaration = ImportDeclaration & {
    importKind: "type" | "value"
};

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        // context.getSourceCode() is deprecated, but context.sourceCode is always undefined
        sourceCode = context.sourceCode ?? context.getSourceCode();

    /**
     * for comparing to current node
     */
    let previousDeclaration: ImportDeclaration & Rule.NodeParentExtension | null = null;
    /**
     * for configuring the how the comparator should sort `import Thing` and `import type OtherThing`
     */
    let leftNodeIsTypeReturn: number, rightNodeIsTypeReturn: number;
    if (cfg.sortTypeImportsFirst === true) {
        leftNodeIsTypeReturn = -1;
        rightNodeIsTypeReturn = 1;
    } else if (cfg.sortTypeImportsFirst === false) {
        leftNodeIsTypeReturn = 1;
        rightNodeIsTypeReturn = -1;
    } else {
        // user didn't specify option, treat the two imports as equal
        leftNodeIsTypeReturn = 0;
        rightNodeIsTypeReturn = 0;
    }

    /**
     * Returns the path name of of an import declaration
     *
     * @param node the ImportDeclaration node
     * @returns path name, e.g. the "@adashrodEps/model/Box" in `import Box from "@adashrodEps/model/Box"`
     */
    function getPathName(node: ImportDeclaration): string {
        const v = node.source.value;
        const t = typeof v;
        if (t !== "string") {
            throw new Error(`source.value property in ImportDeclaration is not a string (${v}: ${t}`);
        }
        return node.source.value as string;
    }

    /**
     * Returns true if:
     * the two nodes are on the same line: `import * as fs from "fs";import { exec } from "child_process";`
     * OR
     * the two nodes are separated by 1 line:
     *      import * as fs from "fs";
     *      import { exec } from "child_process";
     * OR
     * the two nodes are separated by 1 or more lines, but any lines between are filled with comments:
     *      import * as fs from "fs";
     *      // informative comment
     *      import { exec } from "child_process";
     * note: right is assumed to come after left in the source code
     *
     * @param left node
     * @param right node
     * @returns true if the two two nodes are adjacent and not separated by extra line breaks
     */
    function nodesAreAdjacent(left: ImportDeclaration, right: ImportDeclaration): boolean {
        if (!left.loc || !right.loc) {
            throw new Error("loc property undefined in ImportDeclaration(s); can't compare imports");
        }
        const absoluteNumberLinesBetween = right.loc.start.line - left.loc.end.line;
        const commentsBetween = sourceCode.getCommentsAfter(left);
        if (!commentsBetween.length) {
            return absoluteNumberLinesBetween <= 1;
        }
        if (commentsBetween.some(c => !c.loc)) {
            throw new Error("loc property undefined in Comment(s); can't compare imports");
        }
        return (
            // no empty lines between left import and first comment between imports
            commentsBetween[0].loc!.start.line - left.loc.end.line <= 1 &&
            // no empty lines between last comment between imports and right import
            right.loc.start.line - commentsBetween[commentsBetween.length - 1].loc!.end.line <= 1);
    }

    /**
     * Finds all imports before and after the node that meet the criteria. If allowSeparateGroups is false, this
     * returns all ImportDeclaration nodes. If true, this finds all ImportDeclaration nodes adjacent to this node
     * not separated by any empty whitespace lines.
     *
     * @param node an import declaration node
     * @returns array of all surrounding ImportDeclaration nodes
     */
    function getGroupOfAdjacentImports(node: ImportDeclaration & Rule.NodeParentExtension): ImportDeclaration[] {
        let allImports = (node.parent as Program as Ast.Program)
            .body.filter((aBodyNode) => aBodyNode.type === "ImportDeclaration") as ImportDeclaration[];
        if (!cfg.allowSeparateGroups) {
            return allImports.slice();
        }
        let nodeIndex = allImports.indexOf(node);
        let firstIndex = 0, lastIndex = allImports.length - 1;
        for (let i = nodeIndex; i > 0; i--) {
            if (!nodesAreAdjacent(allImports[i - 1], allImports[i])) {
                firstIndex = i;
                break;
            }
        }
        for (let i = nodeIndex; i < allImports.length - 1; i++) {
            if (!nodesAreAdjacent(allImports[i], allImports[i + 1])) {
                lastIndex = i;
                break;
            }
        }
        return allImports.slice(firstIndex, lastIndex + 1);
    }

    /**
     * Comparator for sorting ImportDeclaration AstNodes by path
     * Note: if sortSideEffectsFirst is true, this function sorts those earlier in a list than any other imports
     * Note: given 2 ImportDeclarations with the same path (one value import and one type import), if
     * sortTypeImportsFirst is true, the type import will be sorted first, false: it will be sorted after the
     * value import, undefined: order doesn't matter
     *
     * Note: also factors in the value of ignoreCase
     *
     * @param declarationA an ImportDeclaration
     * @param declarationB an ImportDeclaration
     * @returns comparator result
     */
    function importDeclarationComparator(declarationA: ImportDeclaration, declarationB: ImportDeclaration) {
        if (cfg.sortSideEffectsFirst) {
            const leftIsSideEffectsModule = declarationA.specifiers.length === 0;
            const rightIsSideEffectsModule = declarationB.specifiers.length === 0;
            if (leftIsSideEffectsModule != rightIsSideEffectsModule) {
                return leftIsSideEffectsModule ? -1 : 1;
            }
        }
        const nameA = cfg.ignoreCase ? getPathName(declarationA).toLowerCase() : getPathName(declarationA);
        const nameB = cfg.ignoreCase ? getPathName(declarationB).toLowerCase() : getPathName(declarationB);
        if (nameA === nameB) {
            const da = declarationA as TypeCapableImportDeclaration;
            const db = declarationB as TypeCapableImportDeclaration;
            // duplicate file name in imports, can be caused by importing a class/function/etc on one line and
            // using `import type` from the same file on another line
            if (da.importKind === db.importKind) {
                return 0;
            }
            if (da.importKind === "type") {
                return leftNodeIsTypeReturn;
            }
            return rightNodeIsTypeReturn;
        }
        return nameA > nameB ? 1 : -1;
    }

    /**
     * If 2 ImportDeclarations have the same path, but different importKinds (one is `import Xyz from ...` and the
     * other is `import type Abc from ...`), then the reported error should show the full import declaration, not
     * just the path.
     *
     * @param declarationA an ImportDeclaration
     * @param declarationB an ImportDeclaration
     * @returns true if the 2 declarations have the same path and different importKinds
     */
    function shouldReportFullImport(declarationA: ImportDeclaration, declarationB: ImportDeclaration): boolean {
        const nameA = getPathName(declarationA);
        const nameB = getPathName(declarationB);
        const da = declarationA as TypeCapableImportDeclaration;
        const db = declarationB as TypeCapableImportDeclaration;
        return nameA === nameB && da.importKind !== db.importKind;
    }

    /**
     * If sortSideEffectsFirst is true, and one of the 2 declarations is a side effects module import
     * (`import "abc-xyz"`), return true
     *
     * @param declarationA an ImportDeclaration
     * @param declarationB an ImportDeclaration
     * @returns true if the side effects module error should be shown
     */
    function shouldReportSideEffectsModuleMessage(
            declarationA: ImportDeclaration,
            declarationB: ImportDeclaration): boolean {
        const leftIsSideEffectsModule = declarationA.specifiers.length === 0;
        const rightIsSideEffectsModule = declarationB.specifiers.length === 0;
        return cfg.sortSideEffectsFirst && leftIsSideEffectsModule !== rightIsSideEffectsModule;
    }

    return {
        ImportDeclaration: (node: ImportDeclaration & Rule.NodeParentExtension) => {
            if (previousDeclaration && cfg.allowSeparateGroups && !nodesAreAdjacent(previousDeclaration, node)) {
                // reset for next group
                previousDeclaration = null;
            }

            if (previousDeclaration && getPathName(previousDeclaration) && getPathName(node) &&
                    importDeclarationComparator(previousDeclaration, node) > 0) {
                let importGroup = getGroupOfAdjacentImports(node);
                let messageId, nameA, nameB, typeStyle = "";
                if (shouldReportFullImport(node, previousDeclaration)) {
                    messageId = "sortTypeImports"
                    nameA = sourceCode.getText(node);
                    nameB = sourceCode.getText(previousDeclaration);
                    typeStyle = cfg.sortTypeImportsFirst ? "before" : "after";
                } else if (shouldReportSideEffectsModuleMessage(node, previousDeclaration)) {
                    messageId = "sortSideEffectsFirst";
                    nameA = sourceCode.getText(node);
                    nameB = sourceCode.getText(previousDeclaration);
                } else {
                    messageId = "sortImportsByPath";
                    nameA = getPathName(node);
                    nameB = getPathName(previousDeclaration);
                }
                context.report({
                    node,
                    messageId,
                    data: {
                        declarationA: nameA,
                        declarationB: nameB,
                        typeStyle
                    },
                    fix(fixer: Rule.RuleFixer) {
                        if (importGroup.some(d => !d.range)) {
                            throw new Error("range property undefined in ImportDeclaration(s); can't fix");
                        }
                        const originalLastImport = importGroup[importGroup.length - 1];
                        const replacementText = importGroup.slice()
                            .sort(importDeclarationComparator)
                            .map(declaration => {
                                // ignore comments after the last import because they might semantically be comments
                                // before code following the imports, e.g. class header documentation
                                const commentsAfter = declaration !== originalLastImport ?
                                    sourceCode.getCommentsAfter(declaration) : [];
                                if (commentsAfter.some(c => !c.range)) {
                                    throw new Error("range property undefined in Comment; can't fix");
                                }
                                return sourceCode.getText().slice(declaration.range![0],
                                    commentsAfter.length ?
                                        commentsAfter[commentsAfter.length - 1].range![1] :
                                        declaration.range![1]);
                            })
                            .join("\n");
                        return fixer.replaceTextRange([importGroup[0].range![0], originalLastImport.range![1]],
                            replacementText);
                    }
                });
            }

            previousDeclaration = node;
        }
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

const { nullishCoalesce } = require("./util/misc-js.js");

/**
 * @fileoverview Rule to enforce ordering of imports by path
 * @author Aaron Rodriguez
 */
module.exports = {
    meta: {
        type: "suggestion",

        docs: {
            description:
                "enforce sorted import declarations, sorting imports by path, not name and sorted members in imports",
            recommended: false,
            url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-imports-by-path.md"
        },

        schema: [{
            type: "object",
            properties: {
                ignoreCase: {
                    type: "boolean",
                    default: false
                },
                allowSeparateGroups: {
                    type: "boolean",
                    default: true
                },
                sortSideEffectsFirst: {
                    type: "boolean",
                    default: false
                },
                sortTypeImportsFirst: {
                    type: "boolean",
                    default: true
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
    },
    create(context) {
        const configuration = context.options[0] || {},
            ignoreCase = nullishCoalesce(configuration.ignoreCase, false),
            allowSeparateGroups = nullishCoalesce(configuration.allowSeparateGroups, true),
            sortTypeImportsFirst = nullishCoalesce(configuration.sortTypeImportsFirst, true),
            sortSideEffectsFirst = nullishCoalesce(configuration.sortSideEffectsFirst, false),
            sourceCode = context.getSourceCode();

        /**
         * for comparing to current node
         */
        let previousDeclaration;
        /**
         * for configuring the how the comparator should sort `import Thing` and `import type OtherThing`
         */
        let leftNodeIsTypeReturn, rightNodeIsTypeReturn;
        if (sortTypeImportsFirst) {
            leftNodeIsTypeReturn = -1;
            rightNodeIsTypeReturn = 1;
        } else {
            leftNodeIsTypeReturn = 1;
            rightNodeIsTypeReturn = -1;
        }

        /**
         * Returns the path name of of an import declaration
         *
         * @param {AstNode} node the ImportDeclaration node
         * @returns path name, e.g. the "@app/model/Box" in `import Box from "@app/model/Box"`
         */
        function getPathName(node) {
            return node.source.value;
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
         * @param {AstNode} left node
         * @param {AstNode} right node
         * @returns true if the two two nodes are adjacent and not separated by extra line breaks
         */
        function nodesAreAdjacent(left, right) {
            const absoluteNumberLinesBetween = right.loc.start.line - left.loc.end.line;
            const commentsBetween = sourceCode.getCommentsAfter(left);
            if (!commentsBetween.length) {
                return absoluteNumberLinesBetween <= 1;
            }
            return (
                // no empty lines between left import and first comment between imports
                commentsBetween[0].loc.start.line - left.loc.end.line <= 1 &&
                // no empty lines between last comment between imports and right import
                right.loc.start.line - commentsBetween[commentsBetween.length - 1].loc.end.line <= 1);
        }

        /**
         * Finds all imports before and after the node that meet the criteria. If allowSeparateGroups is false, this
         * returns all ImportDeclaration nodes. If true, this finds all ImportDeclaration nodes adjacent to this node
         * not separated by any empty whitespace lines.
         *
         * @param {AstNode} node an import declaration node
         * @returns array of all surrounding ImportDeclaration nodes
         */
        function getGroupOfAdjacentImports(node) {
            let allImports = node.parent.body.filter((aBodyNode) => aBodyNode.type === "ImportDeclaration");
            if (!allowSeparateGroups) {
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
         * sortTypeImportsFirst is true, the type import will be sorted first, otherwise it will be sorted after the
         * value import.
         * Note: also factors in the value of ignoreCase
         *
         * @param {AstNode} declarationA an ImportDeclaration
         * @param {AstNode} declarationB an ImportDeclaration
         * @returns comparator result
         */
        function importDeclarationComparator(declarationA, declarationB) {
            if (sortSideEffectsFirst) {
                const leftIsSideEffectsModule = declarationA.specifiers.length === 0;
                const rightIsSideEffectsModule = declarationB.specifiers.length === 0;
                if (leftIsSideEffectsModule != rightIsSideEffectsModule) {
                    return leftIsSideEffectsModule ? -1 : 1;
                }
            }
            const nameA = ignoreCase ? getPathName(declarationA).toLowerCase() : getPathName(declarationA);
            const nameB = ignoreCase ? getPathName(declarationB).toLowerCase() : getPathName(declarationB);
            if (nameA === nameB) {
                // duplicate file name in imports, can be caused by importing a class/function/etc on one line and
                // using `import type` from the same file on another line
                if (declarationA.importKind === declarationB.importKind) {
                    return 0;
                }
                if (declarationA.importKind === "type") {
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
         * @param {AstNode} declarationA an ImportDeclaration
         * @param {AstNode} declarationB an ImportDeclaration
         * @returns true if the 2 declarations have the same path and different importKinds
         */
        function shouldReportFullImport(declarationA, declarationB) {
            const nameA = getPathName(declarationA);
            const nameB = getPathName(declarationB);
            return nameA === nameB && declarationA.importKind !== declarationB.importKind;
        }

        /**
         * If sortSideEffectsFirst is true, and one of the 2 declarations is a side effects module import
         * (`import "abc-xyz"`), return true
         *
         * @param {AstNode} declarationA an ImportDeclaration
         * @param {AstNode} declarationB an ImportDeclaration
         * @returns true if the side effects module error should be shown
         */
        function shouldReportSideEffectsModuleMessage(declarationA, declarationB) {
            const leftIsSideEffectsModule = declarationA.specifiers.length === 0;
            const rightIsSideEffectsModule = declarationB.specifiers.length === 0;
            return sortSideEffectsFirst && leftIsSideEffectsModule !== rightIsSideEffectsModule;
        }

        return {
            ImportDeclaration: (node) => {
                if (previousDeclaration && allowSeparateGroups && !nodesAreAdjacent(previousDeclaration, node)) {
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
                        typeStyle = sortTypeImportsFirst ? "before" : "after";
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
                        fix(fixer) {
                            const originalLastImport = importGroup[importGroup.length - 1];
                            const replacementText = importGroup.slice()
                                .sort(importDeclarationComparator)
                                .map(declaration => {
                                    // ignore comments after the last import because they might semantically be comments
                                    // before code following the imports, e.g. class header documentation
                                    const commentsAfter = declaration !== originalLastImport ?
                                        sourceCode.getCommentsAfter(declaration) : [];
                                    return sourceCode.getText().slice(declaration.range[0],
                                        commentsAfter.length ?
                                            commentsAfter[commentsAfter.length - 1].range[1] :
                                            declaration.range[1]);
                                })
                                .join("\n");
                            return fixer.replaceTextRange([importGroup[0].range[0], originalLastImport.range[1]],
                                replacementText);
                        }
                    });
                }

                previousDeclaration = node;
            }
        };
    }
};

/* global console */

import type { AST as Ast, Rule } from "eslint";
import type { ImportDeclaration, Program } from "estree";

import { initializeConfig } from "@adashrodEps/lib/rules/util/eslint";

type Config = {
    ignoreCase: boolean;
    allowSeparateGroups: boolean;
    sortSideEffectsFirst: boolean;
    sortTypeImportsFirst: boolean | undefined;
    groups: Array<string>;
};

const THE_REST_GROUP_NAME = "THE_REST";
const SIDE_EFFECTS_GROUP_NAME = "SIDE_EFFECTS";

const DEFAULT_PROPERTIES: Config = {
    ignoreCase: false,
    allowSeparateGroups: true,
    sortSideEffectsFirst: false,
    sortTypeImportsFirst: undefined,
    groups: [],
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
        url: "https://github.com/adashrod/eslint-plugin-sequence/tree/main/src/docs/ordered-imports-by-path.md",
    },

    schema: [{
        type: "object",
        properties: {
            ignoreCase: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.ignoreCase,
            },
            allowSeparateGroups: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.allowSeparateGroups,
            },
            groups: {
                type: "array",
                items: {
                    type: "string",
                },
                default: DEFAULT_PROPERTIES.groups,
            },
            sortSideEffectsFirst: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.sortSideEffectsFirst,
            },
            sortTypeImportsFirst: {
                type: "boolean",
                default: DEFAULT_PROPERTIES.sortTypeImportsFirst,
            },
        },
        additionalProperties: false,
    }],

    fixable: "code",

    messages: {
        sortSideEffectsFirst:
            "Sort side-effects-only modules before others. " +
            "`{{declarationA}}` should come before `{{declarationB}}`",
        sortImportsByPath:
            "Sort imports alphabetically by path. `{{declarationA}}` should come before `{{declarationB}}`",
        sortTypeImports:
            "Type imports should be sorted {{typeStyle}} value imports. " +
            "`{{declarationA}}` should come before `{{declarationB}}`",
        wrongGroup:
            "{{declaration}} should be in group `{{correctGroupLabel}}` (#{{correctGroupIndex}}) " +
            "but is in group `{{actualGroupLabel}}` (#{{actualGroupIndex}})",
    },
};

type TypeCapableImportDeclaration = ImportDeclaration & {
    importKind: "type" | "value"
};

function create(context: Rule.RuleContext): Rule.RuleListener {
    const cfg = initializeConfig(context.options, DEFAULT_PROPERTIES),
        sourceCode = context.sourceCode;

    const hasTheRestGroup = cfg.groups.some(g => g === THE_REST_GROUP_NAME);
    let usingGroups = cfg.groups.length > 1 && hasTheRestGroup && cfg.allowSeparateGroups;

    function logWarning(message: string): void {
        console.warn(message);
    }

    if (cfg.groups.length > 0) {
        if (!cfg.allowSeparateGroups) {
            logWarning("groups is set, but allowSeparateGroups is false; ignoring groups");
        }
        if (!hasTheRestGroup) {
            logWarning("groups is set, but THE_REST group is not present; ignoring groups");
            usingGroups = false;
        }
    }
    const groupCounts = cfg.groups
        .reduce((acc, group) => { acc[group] = (acc[group] ?? 0) + 1; return acc; }, {} as Record<string, number>);
    if (Object.values(groupCounts).some(count => count > 1)) {
        logWarning("groups contains duplicate group names; ignoring duplicate group names");
    }

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
        if (typeof node.source.value === "string") {
            return node.source.value;
        }
        throw new Error(`source.value property in ImportDeclaration is not a string (${node.source.value}: ${typeof node.source.value}`);
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
        if (commentsBetween.length === 0) {
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
        const allImports = (node.parent as Program as Ast.Program)
            .body.filter((aBodyNode) => aBodyNode.type === "ImportDeclaration") as ImportDeclaration[];
        if (!cfg.allowSeparateGroups) {
            return allImports.slice();
        }
        const nodeIndex = allImports.indexOf(node);
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

    function getAllImports(node: ImportDeclaration & Rule.NodeParentExtension): ImportDeclaration[] {
        return (node.parent as Program as Ast.Program)
            .body.filter((aBodyNode) => aBodyNode.type === "ImportDeclaration") as ImportDeclaration[];
    }

    function partitionImportsIntoGroups(imports: ImportDeclaration[]): ImportDeclaration[][] {
        if (imports.length === 0) {
            return [];
        }
        const groups: ImportDeclaration[][] = [[imports[0]]];
        for (let importIndex = 1; importIndex < imports.length; importIndex++) {
            const importA = imports[importIndex - 1];
            const importB = imports[importIndex];
            if (nodesAreAdjacent(importA, importB)) {
                groups[groups.length - 1].push(importB);
            } else {
                groups.push([importB]);
            }
        }
        return groups;
    }

    /**
     * Sorts all imports into groups based on the regexes in cfg.groups; does not sort imports within a group
     *
     * @param imports an array of ImportDeclaration nodes
     * @returns an array of ImportDeclaration nodes, sorted into groups based on the regexes in cfg.groups
     */
    function sortAllImportsIntoGroups(imports: ImportDeclaration[], effectiveGroups: string[]): ImportDeclaration[][] {
        const groups: ImportDeclaration[][] = Array(effectiveGroups.length).fill(0).map(() => []);
        const groupRegexes = getGroupRegexes(effectiveGroups);
        for (const importDecl of imports) {
            if (cfg.sortSideEffectsFirst && isSideEffectsModule(importDecl)) {
                groups[getSideEffectsGroupIndex(effectiveGroups)].push(importDecl);
                continue;
            }
            const path = getPathName(importDecl);
            const groupIndex = groupRegexes.findIndex(g => g instanceof RegExp && g.test(path));
            if (groupIndex === -1) {
                groups[getTheRestGroupIndex(effectiveGroups)].push(importDecl);
            } else {
                groups[groupIndex].push(importDecl);
            }
        }
        return groups;
    }

    /**
     * Returns the groups from cfg.groups with some filtering
     * SIDE_EFFECTS is added if sortSideEffectsFirst==true and there is at least one side effects module import
     * THE_REST is retained if there is at least one import that does not match any regex
     * regex groups are retained if there is at least one import that matches the regex
     *
     * @param allImports an array of ImportDeclaration nodes
     * @returns an array of strings, the groups from cfg.groups with some filtering
     */
    function getEffectiveGroups(allImports: ImportDeclaration[]): string[] {
        const effectiveGroups = [SIDE_EFFECTS_GROUP_NAME, ...cfg.groups]
            // deduplicate effectiveGroups while maintaining the order
            .filter((group, idx, arr) => arr.indexOf(group) === idx);
        const groupRegexes = getGroupRegexes(effectiveGroups);

        // filter out groups that are not represented in the imports
        return effectiveGroups.filter((group, i) => {
            const groupRegex = groupRegexes[i];
            if (group === THE_REST_GROUP_NAME) {
                // keep the rest group only if there is at least one import that does not match any regex
                // side effects imports should be excluded from the rest bucket if sortSideEffectsFirst==true
                const allRegexes = groupRegexes.filter(g => g instanceof RegExp);
                const atLeastOneImportForTheRestBucket =
                    allImports.some(importDecl => {
                        const importIsInTheRestBucketByPath = !allRegexes.some(gre => gre.test(getPathName(importDecl)));
                        const importIsInSideEffectsBucket = cfg.sortSideEffectsFirst && isSideEffectsModule(importDecl);
                        return importIsInTheRestBucketByPath && !importIsInSideEffectsBucket;
                    });
                return atLeastOneImportForTheRestBucket;
            } else if (group === SIDE_EFFECTS_GROUP_NAME) {
                // keep the side effects group only if sortSideEffectsFirst==true and there is at least one side effects module import
                return cfg.sortSideEffectsFirst && allImports.some(isSideEffectsModule);
            }
            // regex: keep the group if there is at least one import that matches the regex
            return allImports.some(importDecl => groupRegex instanceof RegExp && groupRegex.test(getPathName(importDecl)));
        });
    }

    function getSideEffectsGroupIndex(effectiveGroups: string[]): number {
        return effectiveGroups.indexOf(SIDE_EFFECTS_GROUP_NAME);
    }

    function getTheRestGroupIndex(effectiveGroups: string[]): number {
        return effectiveGroups.indexOf(THE_REST_GROUP_NAME);
    }

    function getGroupRegexes(effectiveGroups: string[]): (RegExp | null)[] {
        return effectiveGroups
            .map(g => g === THE_REST_GROUP_NAME || g === SIDE_EFFECTS_GROUP_NAME ? null : new RegExp(g));
    }

    function getCorrectGroupIndex(importDecl: ImportDeclaration & Rule.NodeParentExtension, effectiveGroups: string[]): number {
        if (cfg.sortSideEffectsFirst && isSideEffectsModule(importDecl)) {
            // in the current implementation, the side effects group is always the first group, but that might change
            return getSideEffectsGroupIndex(effectiveGroups);
        }
        const groupIndex = getGroupRegexes(effectiveGroups).findIndex(g => g instanceof RegExp && g.test(getPathName(importDecl)));
        return groupIndex === -1 ? getTheRestGroupIndex(effectiveGroups) : groupIndex;
    }

    function getActualGroupIndex(importDecl: ImportDeclaration & Rule.NodeParentExtension): number {
        const allImports = getAllImports(importDecl);
        const groups = partitionImportsIntoGroups(allImports);
        return groups.findIndex(g => g.includes(importDecl));
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
    function importDeclarationComparator(declarationA: ImportDeclaration, declarationB: ImportDeclaration): number {
        if (cfg.sortSideEffectsFirst) {
            const leftIsSideEffectsModule = declarationA.specifiers.length === 0;
            const rightIsSideEffectsModule = declarationB.specifiers.length === 0;
            if (leftIsSideEffectsModule !== rightIsSideEffectsModule) {
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
     * Returns true if the import declaration is a side effects module import
     * (`import "abc-xyz"`)
     *
     * @param declaration an ImportDeclaration
     * @returns true if the import declaration is a side effects module import
     */
    function isSideEffectsModule(declaration: ImportDeclaration): boolean {
        return declaration.specifiers.length === 0;
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
        declarationB: ImportDeclaration
    ): boolean {
        const leftIsSideEffectsModule = isSideEffectsModule(declarationA);
        const rightIsSideEffectsModule = isSideEffectsModule(declarationB);
        return cfg.sortSideEffectsFirst && leftIsSideEffectsModule !== rightIsSideEffectsModule;
    }

    /**
     * Returns the text of an import declaration, and following comments, unless the import declaration is the last
     *
     * @param declaration an ImportDeclaration
     * @param lastImport the last ImportDeclaration to care about
     * @returns the text of the import declaration
     */
    function mapDeclarationForFix(declaration: ImportDeclaration, lastImport: ImportDeclaration): string {
        // ignore comments after the last import because they might semantically be comments
        // before code following the imports, e.g. class header documentation
        const commentsAfter = declaration !== lastImport ?
            sourceCode.getCommentsAfter(declaration) : [];
        if (commentsAfter.some(c => !c.range)) {
            throw new Error("range property undefined in Comment; can't fix");
        }
        return sourceCode.getText().slice(declaration.range![0],
            (commentsAfter.length > 0) ?
                commentsAfter[commentsAfter.length - 1].range![1] :
                declaration.range![1]);
    }

    return {
        ImportDeclaration: (node: ImportDeclaration & Rule.NodeParentExtension): void => {
            let reportedWrongGroup = false;
            if (usingGroups) {
                // cfg.allowSeparateGroups is implicitly true here
                const allImports = getAllImports(node);
                const effectiveGroups = getEffectiveGroups(allImports);
                const groups = sortAllImportsIntoGroups(allImports, effectiveGroups);
                const correctGroupIndex = getCorrectGroupIndex(node, effectiveGroups);
                const actualGroupIndex = getActualGroupIndex(node);
                if (correctGroupIndex !== actualGroupIndex) {
                    reportedWrongGroup = true;
                    context.report({
                        node,
                        messageId: "wrongGroup",
                        data: {
                            declaration: getPathName(node),
                            correctGroupLabel: effectiveGroups[correctGroupIndex],
                            correctGroupIndex: String(correctGroupIndex),
                            actualGroupLabel: actualGroupIndex >= effectiveGroups.length ?
                                "<out of bounds>" :
                                effectiveGroups[actualGroupIndex],
                            actualGroupIndex: String(actualGroupIndex),
                        },
                        fix(fixer: Rule.RuleFixer) {
                            const originalLastImport = allImports[allImports.length - 1];
                            const replacementText = groups.map(group => group
                                .slice()
                                .sort(importDeclarationComparator)
                                .map(declaration => mapDeclarationForFix(declaration, originalLastImport))
                                .join("\n")
                            ).join("\n\n");
                            return fixer.replaceTextRange([allImports[0].range![0], originalLastImport.range![1]],
                                replacementText);
                        },
                    });
                }
            }

            if (previousDeclaration && cfg.allowSeparateGroups && !nodesAreAdjacent(previousDeclaration, node)) {
                // reset for next group
                previousDeclaration = null;
            }

            if (previousDeclaration !== null &&
                typeof getPathName(previousDeclaration) === "string" &&
                typeof getPathName(node) === "string" &&
                importDeclarationComparator(previousDeclaration, node) > 0
            ) {
                const importGroup = getGroupOfAdjacentImports(node);
                let messageId, nameA, nameB, typeStyle = "";
                if (shouldReportFullImport(node, previousDeclaration)) {
                    messageId = "sortTypeImports";
                    nameA = sourceCode.getText(node);
                    nameB = sourceCode.getText(previousDeclaration);
                    typeStyle = cfg.sortTypeImportsFirst === true ? "before" : "after";
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
                        typeStyle,
                    },
                    fix(fixer: Rule.RuleFixer) {
                        if (reportedWrongGroup) {
                            // if there are wrongGroup errors, then that fixer will move the imports to the correct
                            // groups, and sort the groups, which addresses all the errors. We don't want conflicts
                            // with the below fixer. Applying both fixers causes incorrect output.
                            return null;
                        }
                        if (importGroup.some(d => !d.range)) {
                            throw new Error("range property undefined in ImportDeclaration(s); can't fix");
                        }
                        const originalLastImport = importGroup[importGroup.length - 1];
                        const replacementText = importGroup.slice()
                            .sort(importDeclarationComparator)
                            .map(declaration => mapDeclarationForFix(declaration, originalLastImport))
                            .join("\n");
                        return fixer.replaceTextRange([importGroup[0].range![0], originalLastImport.range![1]],
                            replacementText);
                    },
                });
            }

            previousDeclaration = node;
        },
    };
}

const rule: Rule.RuleModule = { meta, create };

export default rule;

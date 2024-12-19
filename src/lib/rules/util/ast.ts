import type { AST as Ast } from "eslint";

/**
 * Finds the first matching punctuator at document position greater than or equal to startPos.
 *
 * @param tokens array of program tokens
 * @param startPos    minimum document position
 * @param punctuator  a punctuator, such as ","
 * @returns found token or undefined if not found
 */
export function findPunctuatorAfter(tokens: Ast.Token[], startPos: number, punctuator: string): Ast.Token | null {
    return tokens.find(token =>
        token.type === "Punctuator" &&
        token.value === punctuator &&
        token.range[0] >= startPos
    ) ?? null;
}

/**
 * Finds the first matching punctuator at document position greater than or equal to startPos and less than
 * endPos.
 *
 * @param tokens array of program tokens
 * @param startPos   minimum document position (inclusive)
 * @param endPos     maximum document position (exclusive)
 * @param punctuator a punctuator, such as ","
 * @returns found token or null if not found
 */
export function findPunctuatorBetween(
    tokens: Ast.Token[],
    startPos: number,
    endPos: number,
    punctuator: string
): Ast.Token | null {
    return tokens.find(token =>
        token.type === "Punctuator" &&
        token.value === punctuator &&
        token.range[0] >= startPos &&
        token.range[1] < endPos
    ) ?? null;
}

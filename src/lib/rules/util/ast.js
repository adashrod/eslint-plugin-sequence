module.exports = {
    /**
     * Finds the first matching punctuator at document position greater than or equal to startPos.
     *
     * @param {Ast.Token[]} tokens array of program tokens
     * @param {number} startPos    minimum document position
     * @param {string} punctuator  a punctuator, such as ","
     * @returns found token or undefined if not found
     */
    findPunctuatorAfter(tokens, startPos, punctuator) {
        return tokens.find(token =>
            token.type === "Punctuator" &&
            token.value === punctuator &&
            token.range[0] >= startPos
        );
    },

    /**
     * Finds the first matching punctuator at document position greater than or equal to startPos and less than
     * endPos.
     *
     * @param {Ast.Token[]} tokens array of program tokens
     * @param {number} startPos   minimum document position (inclusive)
     * @param {number} endPos     maximum document position (exclusive)
     * @param {string} punctuator a punctuator, such as ","
     * @returns found token or undefined if not found
     */
    findPunctuatorBetween(tokens, startPos, endPos, punctuator) {
        return tokens.find(token =>
            token.type === "Punctuator" &&
            token.value === punctuator &&
            token.range[0] >= startPos &&
            token.range[1] < endPos
        );
    }
};

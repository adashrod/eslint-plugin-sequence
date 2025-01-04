import stringNaturalCompare from "string-natural-compare";

const alphaPattern = /\p{L}/u;
const digitPattern = /\d/;
const underscoreTrimPattern = /^(_*).*?(_*)$/;
const allCapsSnakeCasePattern = /^[\p{Lu}\d]+(_[\p{Lu}\d]+)+$/u;
const mixedSnakeCasePattern = /^_*[\p{L}\d]+(_[\p{L}\d]+)+_*$/u;

/**
 * Returns true if the character is a letter
 *
 * @param c a character
 * @returns boolean
 */
export function isAlpha(c: string): boolean {
    return alphaPattern.test(c);
}

/**
 * @param c any one-character string
 * @return true if the character is one of "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
 */
export function isDigit(c: string): boolean {
    if (c.length !== 1) {
        throw new Error("Argument to isDigit() must be a single-char string");
    }
    return digitPattern.test(c);
}

/**
 * @param c any one-character string
 * @return true if c is an uppercase letter
 */
export function isUpper(c: string): boolean {
    if (c.length !== 1) {
        throw new Error("Argument to isUpper() must be a single-char string");
    }
    return isAlpha(c) && c === c.toLocaleUpperCase();
}

/**
 * @param s a string
 * @return true if s contains only uppercase letters
 */
export function isAllCaps(s: string): boolean {
    return s.split("").every(isUpper);
}

/**
 * @param s a string
 * @return true if s contains only uppercase letters and digits
 */
export function isAllCapsAndDigits(s: string): boolean {
    return s.split("").every(c => isUpper(c) || isDigit(c));
}

/**
 * @param c any one-character string
 * @return true if c is a lowercase letter
 */
export function isLower(c: string): boolean {
    if (c.length !== 1) {
        throw new Error("Argument to isLower() must be a single-char string");
    }
    return isAlpha(c) && c === c.toLocaleLowerCase();
}

/**
 * Converts a string to one with the first letter uppercase and the rest lowercase,
 * e.g. "HELLO"|"hello"|"hElLo" -> "Hello"
 *
 * @param s a string
 * @returns s with the first letter uppercase and the rest lowercase
 */
export function capitalize(s: string): string {
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
 * @param s a string that's in camel case, strict (e.g. htmlToXml) or invalid (e.g. XMLHttpRequest)
 * @returns array of tokens
 */
export function tokenizePotentiallyInvalidCamelCase(s: string): string[] {
    const result: string[] = [];
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
 * @param s a string in snake case
 * @returns array of tokens
 */
export function tokenizeMixedSnakeCase(s: string): string[] {
    const underscorePaddingMatch = s.match(underscoreTrimPattern);
    if (underscorePaddingMatch === null) {
        throw new Error("tokenizedMixedSnakeCase called on string that doesn't match pattern");
    }
    const leadingUnderscores = underscorePaddingMatch.length >= 2 ? underscorePaddingMatch[1] : "";
    const trailingUnderscores = underscorePaddingMatch.length >= 3 ? underscorePaddingMatch[2] : "";
    const tokens = s.split(/_+/).filter(token => token.length > 0);
    if (leadingUnderscores.length > 0) {
        tokens.unshift(leadingUnderscores);
    }
    if (trailingUnderscores.length > 0) {
        tokens.push(trailingUnderscores);
    }
    return tokens;
}

/**
 * Returns true if the string is all-caps snake case, e.g. "THIS_IS_A_CONSTANT"
 *
 * @param s a string
 * @returns boolean
 */
export function isAllCapsSnakeCase(s: string): boolean {
    return allCapsSnakeCasePattern.test(s);
}

/**
 * Returns true if the string is snake case. There are no restrictions on uppercase or lowercase letters.
 * Leading and trailing underscores are valid. There must be at least one underscore (i.e. two words) to be
 * considered snake case.
 *
 * @param s a string
 * @returns true if the string is snake case, e.g. "this_is_snake_Case"
 */
export function isMixedSnakeCase(s: string): boolean {
    return mixedSnakeCasePattern.test(s);
}

export type StringCompareOptions = {
    ignoreCase: boolean;
    natural: boolean;
};
/**
 * Compares two strings, for use in sorting. Note: this only uses code points for comparison, so it won't properly
 * compare accented characters and should only be used for ASCII characters.
 *
 * @param a a string
 * @param b a string
 * @param options ignoreCase: true for case-insensitive, false for case-sensitive; natural: true for natural (numeric)
 *                sort, false for lexicographic sort
 * @returns a negative number if a should come before b, a positive number if a should come after b, and 0 if they are
 *          equal
 */
export function stringCompare(a: string, b: string, options: StringCompareOptions): number {
    let aString = a;
    let bString = b;
    if (options.ignoreCase) {
        aString = aString.toLocaleLowerCase();
        bString = bString.toLocaleLowerCase();
    }
    // we're not using String.prototype.localeCompare because although it has the { numeric: true } option for natural
    // comparison, it doesn't have an option to be case-sensitive for all chars, only for comparing a lower-case letter
    // against the same letter in upper-case
    if (options.natural) {
        return stringNaturalCompare(aString, bString);
    }
    if (aString === bString) {
        return 0;
    }
    return aString < bString ? -1 : 1;
}
module.exports = {
    /**
     * Similar to the nullish-coalescing operator in JS/TS. Implemented here as a function for node < 14.
     * Returns left if left is not null and not undefined. Returns right if left either is null or undefined.
     *
     * @param {*} left any value
     * @param {*} right default value if left is null or undefined
     * @returns {*} left ?? right
     */
    nullishCoalesce(left, right) {
        return left !== null && left !== undefined ? left : right;
    }
};

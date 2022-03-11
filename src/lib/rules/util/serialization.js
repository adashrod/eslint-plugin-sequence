const tab = "    ";

function helper(obj, indent, cache, path) {
    const theIndent = indent || "";
    const theCache = cache || [];
    const thePath = path || "<root>";
    const found = theCache.find(cacheItem => cacheItem[0] === obj);
    if (found) {
        return `<circular> (${found[1]})`;
    }
    if (obj === null) {
        return "null";
    }
    if (obj === undefined) {
        return "undefined";
    }
    if (typeof obj === "boolean" || typeof obj === "number") {
        return obj.toString();
    }
    if (typeof obj === "string") {
        return `"${obj}"`;
    }
    if (Array.isArray(obj)) {
        theCache.push([obj, thePath]);
        if (obj.length === 0) {
            return "[]";
        }
        let builder = "[\n";
        for (let i = 0; i < obj.length; i++) {
            const element = obj[i];
            const rec = helper(element, theIndent + tab, theCache, `${thePath}[${i}]`);
            builder += `${theIndent + tab}${rec}`;
            if (i + 1 < obj.length) {
                builder += ","
            }
            builder += "\n";
        }
        return builder + `${theIndent}]`;
    }
    if (typeof obj === "object") {
        theCache.push([obj, thePath]);
        const entries = Object.entries(obj);
        if (entries.length === 0) {
            return "{}";
        }
        let builder = "{\n";
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const rec = helper(entry[1], theIndent + tab, theCache, `${thePath}.${entry[0]}`);
            builder += `${theIndent + tab}"${entry[0]}": ${rec}`;
            if (i + 1 < entries.length) {
                builder += ",";
            }
            builder += "\n";
        }
        return builder + `${theIndent}}`;
    }
    if (typeof obj === "function") {
        return obj.toString().slice(0, 30) + "...";
    }
}

module.exports = {
    /**
     * Serializes an object to a pretty-printed JSON-like string. This finds circular references and replaces them in
     * the output with paths to the target objects.
     *
     * E.g.
     * let obj = {
     *     aProp: 5,
     *     meta: {
     *         name: "my object"
     *     }
     * }
     * obj.name = obj.meta.name;
     *
     * objectToString(obj) -->
     * {
     *     "aProp": 5,
     *     "meta": {
     *         "name": "my object"
     *     },
     *     "name": <circular> (<root>.meta.name)
     * }
     *
     * @param {any} object an object to serialize as a JSON-like string
     * @returns a JSON-like string
     */
    objectToString(object) {
        return helper(object);
    }
};

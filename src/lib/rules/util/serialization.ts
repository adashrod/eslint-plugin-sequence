const tab = "    ";

type CacheTuple = [unknown, string];

function helper(obj: unknown, indent: string, cache: CacheTuple[], path: string): string {
    const found = cache.find(cacheItem => cacheItem[0] === obj);
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
        cache.push([obj, path]);
        if (obj.length === 0) {
            return "[]";
        }
        let builder = "[\n";
        for (let i = 0; i < obj.length; i++) {
            const element = obj[i];
            const rec = helper(element, indent + tab, cache, `${path}[${i}]`);
            builder += `${indent + tab}${rec}`;
            if (i + 1 < obj.length) {
                builder += ",";
            }
            builder += "\n";
        }
        return builder + `${indent}]`;
    }
    if (typeof obj === "object") {
        cache.push([obj, path]);
        const entries = Object.entries(obj);
        if (entries.length === 0) {
            return "{}";
        }
        let builder = "{\n";
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const rec = helper(entry[1], indent + tab, cache, `${path}.${entry[0]}`);
            builder += `${indent + tab}"${entry[0]}": ${rec}`;
            if (i + 1 < entries.length) {
                builder += ",";
            }
            builder += "\n";
        }
        return builder + `${indent}}`;
    }
    if (typeof obj === "function") {
        return obj.toString().slice(0, 30) + "...";
    }
    return "unknown";
}

/**
 * Serializes an object to a pretty-printed JSON-like string. This finds circular references and replaces them in
 * the output with paths to the target objects.
 *
 * E.g.
 * let obj = {
 *     aProp: 5,
 *     name: {
 *         first: "misc",
 *         last: "object"
 *     },
 *     meta: {}
 * };
 * obj.meta.name = obj.name;
 * objectToString(obj) -->
 * {
 *     "aProp": 5,
 *     "name": {
 *         "first": "misc",
 *         "last": "object"
 *     },
 *     "meta": {
 *         "name": <circular> (<root>.name)
 *     }
 * }
 *
 * @param object an object to serialize as a JSON-like string
 * @returns a JSON-like string
 */
export function objectToString(object: unknown): string {
    return helper(object, "", [], "<root>");
}

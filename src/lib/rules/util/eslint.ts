/**
 * Initializes the properties for a rule
 *
 * If the schema in the rule's meta has defaults for the rule's properties, EsLint will populate the defaults if the
 * EsLint rule has a config. If the rule has no config, EsLint does not populate defaults, options will be an empty
 * array, and the defaultConfig will be used, e.g.
 *
 * config looks like:                   context.options ==
 * "rule": "error",                     []
 * "rule": "warn",                      []
 * "rule": 2,                           []
 * "rule": ["error"],                   []
 * "rule": ["error", {}],               [{option1: defaultFromSchema}] // all props populated with schema defaults
 * "rule": ["error", {"op1":true}],     [{op1:true, op2: defaultFromSchema}] // all unspecified props get defaults
 * "rule": ["error", "warn"],           throws an error (8.5.0), must be an object
 * "rule": ["error", {}, {}],           throws an error (8.5.0), shouldn't have more than 1 item
 *
 * @param options the options array from the eslint rule config
 * @param defaultConfig default properties for the rule
 * @returns properties for the rule
 */
export function initializeConfig<T>(options: unknown[], defaultConfig: T): T {
    if (options.length === 0) {
        return defaultConfig;
    }
    return options[0] as T;
}

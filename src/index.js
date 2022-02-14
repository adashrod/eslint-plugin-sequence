const { create, meta } = require("./lib/rules/ordered-imports-by-path.js");

module.exports = {
    rules: {
        "ordered-imports-by-path": {
            create,
            meta
        }
    },
};

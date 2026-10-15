/**
 * Strips MongoDB operator keys (starting with "$") and dotted keys from
 * user-supplied input so values like { "$ne": null } can never reach a
 * Mongoose filter. Services that build operators do so server-side, so no
 * legitimate client payload needs these keys.
 */
const isPlainObject = (value) =>
    value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date) && !Buffer.isBuffer(value);

const sanitizeValue = (value) => {
    if (Array.isArray(value)) {
        return value.map(sanitizeValue);
    }

    if (isPlainObject(value)) {
        Object.keys(value).forEach((key) => {
            if (key.startsWith('$') || key.includes('.')) {
                delete value[key];
            } else {
                value[key] = sanitizeValue(value[key]);
            }
        });
    }

    return value;
};

const sanitizeInput = (req, res, next) => {
    if (req.body) sanitizeValue(req.body);
    if (req.query) sanitizeValue(req.query);
    if (req.params) sanitizeValue(req.params);
    next();
};

module.exports = { sanitizeInput };

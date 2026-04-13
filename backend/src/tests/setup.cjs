// Patch mongoose.model() to be idempotent.
// Vitest's module resolution can load the same model file under two different
// cache keys (with and without the .js extension), which causes mongoose to
// throw OverwriteModelError. This patch makes a second registration a no-op.
const mongoose = require("mongoose");
const _model = mongoose.model.bind(mongoose);
mongoose.model = function patchedModel(name, schema, ...rest) {
    if (schema && mongoose.modelNames().includes(name)) {
        return mongoose.models[name];
    }
    return _model(name, schema, ...rest);
};

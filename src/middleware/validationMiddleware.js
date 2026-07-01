import ApiError from "../utils/ApiError.js";

/**
 * Flexible validation middleware supporting Zod schemas that can validate
 * body, params, and/or query.
 *
 * - If the schema contains a `body` / `params` / `query` key (object schema),
 *   it validates the corresponding parts of the request.
 * - If the schema is a flat object schema (legacy), it validates req.body only.
 *
 * @param {import('zod').ZodTypeAny} schema
 */
const validate = (schema) => (req, res, next) => {
  // Detect whether the schema is a "partitioned" schema (has body/params/query keys)
  const shape = schema._def?.shape?.();
  const isPartitioned = shape && ('body' in shape || 'params' in shape || 'query' in shape);

  let input;
  if (isPartitioned) {
    input = {
      ...(shape.body ? { body: req.body } : {}),
      ...(shape.params ? { params: req.params } : {}),
      ...(shape.query ? { query: req.query } : {})
    };
  } else {
    // Legacy flat schema — validate body only
    input = req.body;
  }

  const result = schema.safeParse(input);

  if (!result.success) {
    const errorMessages = result.error.issues.map((issue) => issue.message);
    return next(new ApiError(errorMessages.join(', '), 400));
  }

  // Merge validated data back
  if (isPartitioned) {
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) req.query = result.data.query;
  } else {
    req.body = result.data;
  }

  next();
};

export default validate;
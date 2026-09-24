// Express 5 already forwards rejected promises from async handlers to error
// middleware automatically, so this wrapper is belt-and-suspenders rather
// than load-bearing — kept because it makes every controller's intent
// explicit and keeps the code portable if that ever changes.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default asyncHandler;

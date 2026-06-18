export const sanitizeInputs = (req, res, next) => {
  const clean = (obj) => {
    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key.startsWith('$')) {
            delete obj[key];
          } else {
            clean(obj[key]);
          }
        }
      }
    }
  };
  clean(req.body);
  clean(req.query);
  clean(req.params);
  next();
};

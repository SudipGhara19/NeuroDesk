const { validationResult } = require('express-validator');

// Validation middleware that checks the result of express-validator rules
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // If there are validation errors, return 400 with the array
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = { validateInput };

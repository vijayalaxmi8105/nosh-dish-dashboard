const MAX_NAME_LENGTH = 200;

function isHttpUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

// Returns an array of error messages. Empty array means valid.
function validatePatch(body, dish) {
  const errors = [];
  const { dishName, isPublished, expectedVersion } = body || {};

  if (typeof dishName !== 'string') {
    errors.push('dishName must be a string');
  } else if (dishName.length > MAX_NAME_LENGTH) {
    errors.push(`dishName must be at most ${MAX_NAME_LENGTH} characters`);
  }

  if (typeof isPublished !== 'boolean') {
    errors.push('isPublished must be a boolean');
  }

  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    errors.push('expectedVersion must be a positive integer');
  }

  // Publish rules only make sense once the basic types are valid
  if (errors.length === 0 && isPublished === true) {
    if (dishName.trim() === '') {
      errors.push('A published dish must have a non-empty name');
    }
    if (!isHttpUrl(dish.imageUrl)) {
      errors.push('A published dish must have a valid http/https imageUrl');
    }
  }

  return errors;
}

module.exports = { validatePatch, isHttpUrl };
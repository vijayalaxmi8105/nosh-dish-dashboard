const db = require('./db');

const toDish = (row) =>
  row && { ...row, isPublished: row.isPublished === 1 };

const getAll = () =>
  db.prepare('SELECT * FROM dishes ORDER BY CAST(dishId AS INTEGER)').all().map(toDish);

const getById = (dishId) =>
  toDish(db.prepare('SELECT * FROM dishes WHERE dishId = ?').get(dishId));

const updateStmt = db.prepare(`
  UPDATE dishes
  SET dishName = ?, isPublished = ?, version = version + 1
  WHERE dishId = ? AND version = ?
`);

// One single SQL statement: the version check and the write are atomic.
// Returns true if saved, false if the version did not match.
const updateIfVersionMatches = (dishId, dishName, isPublished, expectedVersion) =>
  updateStmt.run(dishName, isPublished ? 1 : 0, dishId, expectedVersion).changes === 1;

module.exports = { getAll, getById, updateIfVersionMatches };
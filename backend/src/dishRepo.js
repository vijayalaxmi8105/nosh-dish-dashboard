const db = require('./db');

const toDish = (row) =>
  row && { ...row, isPublished: row.isPublished === 1 };

const getAll = () =>
  db.prepare('SELECT * FROM dishes ORDER BY CAST(dishId AS INTEGER)').all().map(toDish);

const getById = (dishId) =>
  toDish(db.prepare('SELECT * FROM dishes WHERE dishId = ?').get(dishId));

module.exports = { getAll, getById, toDish };
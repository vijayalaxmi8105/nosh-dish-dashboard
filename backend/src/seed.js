const fs = require('fs');
const path = require('path');
const db = require('./db');

const file = path.join(__dirname, '..', 'data', 'dishes.json');
const dishes = JSON.parse(fs.readFileSync(file, 'utf8'));

const insert = db.prepare(`
  INSERT OR IGNORE INTO dishes (dishId, dishName, imageUrl, isPublished, version)
  VALUES (?, ?, ?, ?, 1)
`);

const seedAll = db.transaction((rows) => {
  let added = 0;
  for (const d of rows) {
    const result = insert.run(
      String(d.dishId),
      d.dishName,
      d.imageUrl,
      d.isPublished ? 1 : 0
    );
    added += result.changes;
  }
  return added;
});

const added = seedAll(dishes);
const total = db.prepare('SELECT COUNT(*) AS n FROM dishes').get().n;
console.log(`Seed done. Added ${added} new dish(es). Total in DB: ${total}.`);
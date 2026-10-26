const db = require('./db');

db.prepare(`
  INSERT OR IGNORE INTO dishes (dishId, dishName, imageUrl, isPublished, version)
  VALUES ('test-bad-url', 'Bad URL Dish', 'not-a-valid-url', 0, 1)
`).run();

console.log('Test dish added: test-bad-url');
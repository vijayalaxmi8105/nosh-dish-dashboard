require('dotenv').config();
const express = require('express');
const cors = require('cors');
const repo = require('./dishRepo');
const { validatePatch } = require('./validate');
const app = express();
app.use(cors());
app.use(express.json());

app.get('/dishes', (req, res) => {
  try {
    res.json(repo.getAll());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/dishes/:dishId', (req, res) => {
  try {
    const { dishId } = req.params;

    const dish = repo.getById(dishId);
    if (!dish) return res.status(404).json({ error: 'Dish not found' });

    const errors = validatePatch(req.body, dish);
    if (errors.length) return res.status(400).json({ errors });

    const { dishName, isPublished, expectedVersion } = req.body;
    const saved = repo.updateIfVersionMatches(dishId, dishName, isPublished, expectedVersion);

    if (!saved) {
      return res.status(409).json({
        error: 'Conflict: this dish was updated by someone else',
        current: repo.getById(dishId),
      });
    }

    res.json(repo.getById(dishId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Malformed JSON body -> 400
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
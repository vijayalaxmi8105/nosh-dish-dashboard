require('dotenv').config();
const express = require('express');
const cors = require('cors');
const repo = require('./dishRepo');

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
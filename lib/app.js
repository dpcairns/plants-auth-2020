const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const morgan = require('morgan');
const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev')); // http logging

const authRoutes = createAuthRoutes();

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password
app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
// intercepts every request
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/plants', async(req, res) => {
  try {
    const data = await client.query('SELECT * FROM plants WHERE plants.owner_id = $1', [req.userId]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.put('/api/plants/:id', async(req, res) => {
  try {
    const data = await client.query(`
      UPDATE plants
      SET is_watered = true
      WHERE plants.owner_id = $1
      AND plants.id = $2
      RETURNING *;
      `, [req.userId, req.params.id]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/plants', async(req, res) => {
  try {
    const data = await client.query(`
      INSERT INTO plants (name, cool_factor, owner_id, is_watered)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `, [
      req.body.name, 
      req.body.cool_factor, 
      req.userId, 
      false,
    ]);
    
    res.json(data.rows);
  } catch(e) {
    
    res.status(500).json({ error: e.message });
  }
});

app.use(require('./middleware/error'));

module.exports = app;

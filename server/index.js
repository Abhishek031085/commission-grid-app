const express = require('express');
const cors = require('cors');
const pool = require('./db');

const app = express();
const PORT = 5000;

app.use(cors({
  origin: 'https://commission-front-end.onrender.com', // ✅ only allow your frontend
  methods: ['GET', 'POST'],
  credentials: true
}));

app.use(express.json());

// route for state dropdown
app.get('/api/states', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT state FROM comm_grid ORDER BY state');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching states:', err);
    res.status(500).send('Server error while fetching states');
  }
});

// route for month dropdown
app.get('/api/months', async (req, res) => {
  try {
    const state = req.query.state;
    const result = await pool.query(
      'SELECT DISTINCT month FROM comm_grid WHERE state = $1 ORDER BY month',
      [state]
    );
    console.log('Received state:', state);
    console.log('Fetched months from DB:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching months:', err);
    res.status(500).send('Server error while fetching months');
  }
});

// route for policy_type dropdown
app.get('/api/policy_types', async (req, res) => {
  try {
    const { state, month } = req.query;

    if (!month || !state) {
      return res.status(400).send('Month or state query param is missing');
    }

    const result = await pool.query(
      'SELECT DISTINCT policy_type FROM comm_grid WHERE month = $1 AND state = $2',
      [month, state]
    );

    console.log('Fetched policy types from DB:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching policy types:', err.stack);
    res.status(500).send('Server error while fetching policy types');
  }
});

// route for segment dropdown
app.get('/api/segments', async (req, res) => {
  try {
    const { state, month, policyType } = req.query;

    const result = await pool.query(
      'SELECT DISTINCT vehicle_type FROM comm_grid WHERE month = $1 AND policy_type = $2 AND state = $3',
      [month, policyType, state]
    );

    res.json(result.rows.map(r => r.vehicle_type));
  } catch (err) {
    console.error('Error fetching segments:', err);
    res.status(500).send('Server error while fetching segments');
  }
});

// route for search
app.post('/api/search', async (req, res) => {
  try {
    const { month, policyType, segment, state } = req.body;

    const result = await pool.query(
      `SELECT state, vehicle_type, company, policy_type, rate, discount, fuel, month, remarks
       FROM comm_grid
       WHERE month = $1 AND policy_type = $2 AND vehicle_type = $3 AND state = $4 order by rate desc`,
      [month, policyType, segment, state]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error searching data:', err);
    res.status(500).send('Server error while searching commission grid');
  }
});



app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

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

// route for month drop down
app.get('/api/months', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT month FROM comm_grid ORDER BY month');

    console.log('Fetched months from DB:', result.rows); 
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching months:', err);
    res.status(500).send('Server error while fetching months');
  }
});

app.get('/api/policy_types', async (req, res) => {
  try {
    const month = req.query.month;
    console.log('Received month:', month); // 👈 log it clearly

    if (!month) {
      return res.status(400).send('Month query param is missing');
    }

    const result = await pool.query(
      'SELECT DISTINCT policy_type FROM comm_grid WHERE month = $1',
      [month]
    );

    console.log('Fetched policy types from DB:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching policy types:', err.stack);
    res.status(500).send('Server error while fetching policy types');
  }
});


// route for segment
app.get('/api/segments', async (req, res) => {
  const { month, policyType } = req.query;
  try {
    const result = await pool.query(
      'SELECT DISTINCT vehicle_type FROM comm_grid WHERE month = $1 AND policy_type = $2',
      [month, policyType]
    );
    res.json(result.rows.map(r => r.vehicle_type));
  } catch (err) {
    console.error('Error fetching segments:', err);
    res.status(500).send('Server error while fetching segments');
  }
});

//route for search
app.post('/api/search', async (req, res) => {
  const { month, policyType, segment } = req.body;
  try {
    const result = await pool.query(
      `SELECT state, vehicle_type, company, policy_type, rate,discount, fuel, month, remarks
       FROM comm_grid
       WHERE month = $1 AND policy_type = $2 AND vehicle_type = $3`,
      [month, policyType, segment]
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

import express from 'express';
import cors from 'cors';
import pool from './db.js';
import linksRouter from './routes/links.js';
import redirectRouter from './routes/redirect.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.set('trust proxy', true);
app.use(cors());
app.use(express.json());

app.use('/api/links', linksRouter);
app.use('/r', redirectRouter);

async function start() {
  await pool.query(`ALTER TABLE links ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;`);
  await pool.query(`ALTER TABLE links ADD COLUMN IF NOT EXISTS owner_token VARCHAR(64);`);
  app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });
}

start().catch(err => { console.error(err); process.exit(1); });

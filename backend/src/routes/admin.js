import { Router } from 'express';
import { randomUUID } from 'crypto';
import pool from '../db.js';

const router = Router();
const sessions = new Set();

router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPass = process.env.ADMIN_PASSWORD;

  if (!adminPass) return res.status(503).json({ error: 'ADMIN_PASSWORD не задан в .env' });
  if (!password || password !== adminPass) return res.status(401).json({ error: 'Неверный пароль' });

  const token = randomUUID();
  sessions.add(token);
  res.json({ token });
});

function requireAdmin(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || !sessions.has(token)) return res.status(401).json({ error: 'Не авторизован' });
  next();
}

router.get('/links', requireAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        l.slug,
        l.original_url,
        l.expires_at,
        l.created_at,
        COUNT(v.id)          AS total_visits,
        COUNT(DISTINCT v.ip) AS unique_visits
      FROM links l
      LEFT JOIN visits v ON v.link_id = l.id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    res.json(rows.map(r => ({
      slug: r.slug,
      originalUrl: r.original_url,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      totalVisits: Number(r.total_visits),
      uniqueVisits: Number(r.unique_visits),
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

router.delete('/links/:slug', requireAdmin, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM links WHERE slug = $1', [req.params.slug]);
    if (!rowCount) return res.status(404).json({ error: 'Ссылка не найдена' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

export default router;

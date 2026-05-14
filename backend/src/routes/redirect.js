import { Router } from 'express';
import pool from '../db.js';

const router = Router();

router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      'SELECT id, original_url, expires_at FROM links WHERE slug = $1',
      [slug]
    );
    if (!rows.length) {
      return res.redirect(302, '/not-found');
    }
    const link = rows[0];

    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return res.redirect(302, '/not-found');
    }

    const ip =
      (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'unknown';

    pool.query('INSERT INTO visits (link_id, ip) VALUES ($1, $2)', [link.id, ip]).catch(console.error);

    res.redirect(302, link.original_url);
  } catch (err) {
    console.error(err);
    res.status(500).send('Ошибка сервера');
  }
});

export default router;

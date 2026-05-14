import { Router } from 'express';
import { customAlphabet } from 'nanoid';
import pool from '../db.js';

const genId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789', 6);

const router = Router();

router.post('/', async (req, res) => {
  const { url, slug: customSlug, expiresIn, ownerToken } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL обязателен' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Некорректный URL' });
  }

  const slug = customSlug ? customSlug.trim() : genId();

  if (slug.length < 2 || slug.length > 50) {
    return res.status(400).json({ error: 'Название должно быть от 2 до 50 символов' });
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(slug)) {
    return res.status(400).json({ error: 'Название может содержать только буквы, цифры, - и _' });
  }

  const validDays = [1, 3, 7, 14];
  const days = expiresIn != null && validDays.includes(Number(expiresIn)) ? Number(expiresIn) : null;
  const expiresAt = days ? new Date(Date.now() + days * 86400000) : null;

  try {
    const token = typeof ownerToken === 'string' && ownerToken.length <= 64 ? ownerToken : null;
    const { rows } = await pool.query(
      'INSERT INTO links (slug, original_url, expires_at, owner_token) VALUES ($1, $2, $3, $4) RETURNING id, slug, original_url, expires_at, created_at',
      [slug, url, expiresAt, token]
    );
    const link = rows[0];
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      slug: link.slug,
      shortUrl: `${baseUrl}/r/${link.slug}`,
      originalUrl: link.original_url,
      expiresAt: link.expires_at,
      createdAt: link.created_at,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Это название уже занято' });
    }
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.delete('/:slug', async (req, res) => {
  const { slug } = req.params;
  const token = req.headers['x-owner-token'];

  if (!token) return res.status(401).json({ error: 'Токен не указан' });

  try {
    const { rowCount } = await pool.query(
      'DELETE FROM links WHERE slug = $1 AND owner_token = $2',
      [slug, token]
    );
    if (!rowCount) return res.status(403).json({ error: 'Нет доступа' });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

router.get('/:slug/stats', async (req, res) => {
  const { slug } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT
         l.slug,
         l.original_url,
         l.expires_at,
         l.created_at,
         COUNT(v.id)          AS total_visits,
         COUNT(DISTINCT v.ip) AS unique_visits
       FROM links l
       LEFT JOIN visits v ON v.link_id = l.id
       WHERE l.slug = $1
       GROUP BY l.id`,
      [slug]
    );
    if (!rows.length) {
      return res.status(404).json({ error: 'Ссылка не найдена' });
    }
    const r = rows[0];
    res.json({
      slug: r.slug,
      originalUrl: r.original_url,
      expiresAt: r.expires_at,
      createdAt: r.created_at,
      totalVisits: Number(r.total_visits),
      uniqueVisits: Number(r.unique_visits),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

export default router;

const BASE = '/api';

export async function createLink(url, slug, expiresIn) {
  const ownerToken = crypto.randomUUID();
  const res = await fetch(`${BASE}/links`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, slug: slug || undefined, expiresIn, ownerToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return { ...data, ownerToken };
}

export async function deleteLink(slug, ownerToken) {
  if (!ownerToken) return;
  const res = await fetch(`${BASE}/links/${slug}`, {
    method: 'DELETE',
    headers: { 'X-Owner-Token': ownerToken },
  });
  if (!res.ok && res.status !== 404 && res.status !== 403) throw new Error('Ошибка удаления');
}

export async function fetchStats(slug) {
  const res = await fetch(`${BASE}/links/${slug}/stats`);
  if (!res.ok) return null;
  return res.json();
}

export async function adminLogin(password) {
  const res = await fetch(`${BASE}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data.token;
}

export async function adminGetLinks(token) {
  const res = await fetch(`${BASE}/admin/links`, {
    headers: { 'X-Admin-Token': token },
  });
  if (res.status === 401) throw new Error('unauthorized');
  if (!res.ok) throw new Error('Ошибка загрузки');
  return res.json();
}

export async function adminDeleteLink(slug, token) {
  const res = await fetch(`${BASE}/admin/links/${slug}`, {
    method: 'DELETE',
    headers: { 'X-Admin-Token': token },
  });
  if (!res.ok && res.status !== 404) throw new Error('Ошибка удаления');
}

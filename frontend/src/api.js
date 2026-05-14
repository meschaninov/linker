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

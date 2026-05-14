<template>
  <article class="card" :class="{ 'card--expired': isExpired }">
    <div class="card-top">
      <div class="card-urls">
        <div class="short-url-row">
          <a :href="safeShortUrl" target="_blank" rel="noopener noreferrer" class="short-url" :class="{ 'short-url--expired': isExpired }">
            {{ safeShortUrl.replace(/^https?:\/\//, '') }}
          </a>
          <span v-if="isExpired" class="expired-badge">Истекла</span>
        </div>
        <span class="original-url" :title="link.originalUrl">{{ link.originalUrl }}</span>
      </div>
      <div class="card-actions">
        <button class="icon-btn" :title="copied ? 'Скопировано!' : 'Скопировать'" @click="copy">
          <Transition name="icon-swap" mode="out-in">
            <svg v-if="!copied" key="copy" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
            </svg>
            <svg v-else key="check" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="check-icon">
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          </Transition>
        </button>
        <button class="icon-btn" :class="{ 'icon-btn--loading': qrLoading }" title="Скачать QR-код" :disabled="qrLoading" @click="downloadQr">
          <svg v-if="!qrLoading" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3M21 21v.01M12 7v3a2 2 0 0 1-2 2H7M3 12h.01M12 3h.01M12 16v.01M16 12h1M21 12v.01M12 21v-1"/>
          </svg>
          <span v-else class="qr-spinner" />
        </button>
        <Transition name="icon-swap" mode="out-in">
          <button v-if="!confirming" key="delete" class="icon-btn icon-btn--danger" title="Удалить из списка" @click="confirming = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
            </svg>
          </button>
          <span v-else key="confirm" class="confirm-row">
            <button class="confirm-btn confirm-btn--yes" title="Да, удалить" @click="$emit('remove', link.slug)">Удалить</button>
            <button class="confirm-btn confirm-btn--no" title="Отмена" @click="confirming = false">Отмена</button>
          </span>
        </Transition>
      </div>
    </div>

    <div class="card-stats">
      <span class="stat">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
        </svg>
        <Transition name="num" mode="out-in">
          <span :key="stats?.totalVisits" class="stat-val">{{ stats?.totalVisits ?? '—' }}</span>
        </Transition>
        переходов
      </span>
      <span class="stat-dot" aria-hidden="true" />
      <span class="stat">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <Transition name="num" mode="out-in">
          <span :key="stats?.uniqueVisits" class="stat-val">{{ stats?.uniqueVisits ?? '—' }}</span>
        </Transition>
        уникальных
      </span>
      <span class="stat-dot" aria-hidden="true" />
      <span class="stat stat--date">{{ formatDate(link.createdAt) }}</span>
      <template v-if="expiryLabel">
        <span class="stat-dot" aria-hidden="true" />
        <span class="stat" :class="{ 'stat--expired': isExpired }">{{ expiryLabel }}</span>
      </template>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue';
import QRCodeStyling from 'qr-code-styling';

const props = defineProps({
  link: { type: Object, required: true },
  stats: { type: Object, default: null },
});
defineEmits(['remove']);

const isExpired = computed(() => {
  const exp = props.link.expiresAt || props.stats?.expiresAt;
  return exp ? new Date(exp) < new Date() : false;
});

const safeShortUrl = computed(() => {
  const u = props.link.shortUrl || '';
  if (/^https?:\/\//i.test(u)) return u;
  return 'https://' + u.replace(/^\/+/, '');
});

const expiryLabel = computed(() => {
  const exp = props.link.expiresAt || props.stats?.expiresAt;
  if (!exp) return null;
  const diff = Math.ceil((new Date(exp) - new Date()) / 86400000);
  if (diff <= 0) return 'Истекла';
  if (diff === 1) return 'Истекает завтра';
  return `Ещё ${diff} дн.`;
});

const copied = ref(false);
const confirming = ref(false);
const qrLoading = ref(false);

function resolveAccentHex() {
  const val = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = val;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
}

async function downloadQr() {
  if (qrLoading.value) return;
  qrLoading.value = true;
  try {
    const color = resolveAccentHex();
    const size = 400;
    const radius = 36;

    const qr = new QRCodeStyling({
      width: size,
      height: size,
      type: 'canvas',
      data: props.link.shortUrl,
      image: window.location.origin + '/icon.png',
      margin: 12,
      qrOptions: { errorCorrectionLevel: 'H' },
      dotsOptions: { color, type: 'rounded' },
      backgroundOptions: { color: '#ffffff' },
      imageOptions: { crossOrigin: 'anonymous', margin: 8, imageSize: 0.28, hideBackgroundDots: true },
      cornersSquareOptions: { color, type: 'extra-rounded' },
      cornersDotOptions: { color, type: 'dot' },
    });

    const blob = await qr.getRawData('png');
    const img = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = URL.createObjectURL(blob);
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.clip();
    ctx.drawImage(img, 0, 0);

    const a = document.createElement('a');
    a.download = `${props.link.slug}-qr.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  } finally {
    qrLoading.value = false;
  }
}

async function copy() {
  try {
    await navigator.clipboard.writeText(props.link.shortUrl);
    copied.value = true;
    setTimeout(() => { copied.value = false; }, 1800);
  } catch {
    // clipboard not available
  }
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}
</script>

<style scoped>
.card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  border-color: color-mix(in oklch, var(--border) 60%, var(--accent) 40%);
  box-shadow: 0 2px 12px -4px var(--shadow);
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.card-urls {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.short-url-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.short-url {
  font-size: 14px;
  font-weight: 500;
  color: var(--accent);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.short-url--expired {
  color: var(--muted-foreground);
  text-decoration: line-through;
  opacity: 0.6;
}

.expired-badge {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 999px;
  background: oklch(from var(--danger) l c h / 0.1);
  color: var(--danger);
  border: 1px solid oklch(from var(--danger) l c h / 0.2);
  letter-spacing: 0.02em;
}

.card--expired .card-urls {
  opacity: 0.55;
}

.card--expired .card-stats {
  opacity: 0.6;
}

.short-url:hover {
  opacity: 0.8;
  text-decoration: underline;
}

.original-url {
  font-size: 12px;
  color: var(--muted-foreground);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: calc(var(--radius) - 2px);
  transition: background 0.15s, color 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

.icon-btn:hover {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}

.icon-btn:active {
  transform: scale(0.88);
}

.icon-btn--danger:hover {
  background: oklch(from var(--danger) l c h / 0.1);
  color: var(--danger);
}

.icon-btn--loading {
  opacity: 0.5;
  cursor: not-allowed;
}

.qr-spinner {
  display: inline-block;
  width: 10px;
  height: 10px;
  border: 1.5px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.confirm-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.confirm-btn {
  height: 24px;
  padding: 0 8px;
  border-radius: calc(var(--radius) - 3px);
  font-size: 11px;
  font-weight: 500;
  border: none;
  transition: background 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

.confirm-btn:active {
  transform: scale(0.94);
}

.confirm-btn--yes {
  background: oklch(from var(--danger) l c h / 0.12);
  color: var(--danger);
}

.confirm-btn--yes:hover {
  background: oklch(from var(--danger) l c h / 0.2);
}

.confirm-btn--no {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--muted-foreground);
}

.confirm-btn--no:hover {
  background: oklch(from var(--foreground) l c h / 0.1);
  color: var(--foreground);
}

.check-icon {
  color: var(--accent);
}

/* icon swap in buttons */
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.1s ease, transform 0.1s cubic-bezier(0.32, 0.72, 0, 1);
}
.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.5);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.5);
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.stat {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--muted-foreground);
}

.stat-val {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
  color: var(--foreground);
}

.stat--date {
  margin-left: auto;
}

.stat--expired {
  color: var(--danger);
}

@media (max-width: 400px) {
  .stat--date { display: none; }
  .stat-dot:last-of-type { display: none; }
}

.stat-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
}

/* number counter animation */
.num-enter-active,
.num-leave-active {
  transition: opacity 0.15s ease, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.num-enter-from {
  opacity: 0;
  transform: translateY(-6px);
}
.num-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

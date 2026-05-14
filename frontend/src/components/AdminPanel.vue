<template>
  <div class="layout">
    <header class="header">
      <div class="header-inner">
        <a href="/" class="logo">
          <img src="/icon.png" alt="" class="logo-icon" aria-hidden="true" />
          <span class="logo-text">
            <span class="logo-name">Linker</span>
            <span class="logo-sub">панель администратора</span>
          </span>
        </a>
        <div class="header-right">
          <button
            v-if="token"
            class="logout-btn"
            @click="logout"
          >Выйти</button>
          <button
            ref="themeBtn"
            class="theme-btn"
            :title="isDark ? 'Светлая тема' : 'Тёмная тема'"
            @click="toggleTheme"
          >
            <Transition name="icon-swap" mode="out-in">
              <svg v-if="isDark" key="sun" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
              </svg>
              <svg v-else key="moon" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            </Transition>
          </button>
        </div>
      </div>
    </header>

    <main class="main">
      <Transition name="page" mode="out-in">

        <!-- ───── Login ───── -->
        <section v-if="!token" key="login" class="login-section">
          <div class="login-card">
            <div class="login-icon-wrap" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 class="login-title">Вход</h1>
            <p class="login-sub">Панель доступна только администратору</p>

            <form class="login-form" @submit.prevent="login">
              <div class="field">
                <label class="field-label" for="admin-password">Пароль</label>
                <input
                  id="admin-password"
                  v-model="password"
                  type="password"
                  class="input"
                  placeholder="••••••••"
                  autocomplete="current-password"
                  :disabled="logging"
                  autofocus
                />
              </div>

              <Transition name="error-fade">
                <p v-if="loginError" class="error-msg">{{ loginError }}</p>
              </Transition>

              <button type="submit" class="btn-primary" :disabled="logging || !password">
                <span v-if="logging" class="spinner" />
                {{ logging ? 'Проверяем...' : 'Войти' }}
              </button>
            </form>
          </div>
        </section>

        <!-- ───── Dashboard ───── -->
        <section v-else key="dashboard" class="dashboard">
          <div class="section-header">
            <h2 class="section-title">
              Все ссылки
              <span class="section-count">{{ links.length }}</span>
            </h2>
            <button
              class="refresh-btn"
              :disabled="loading"
              title="Обновить статистику"
              @click="loadLinks"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="13" height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="refresh-icon"
                :class="{ spinning: loading }"
              >
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                <path d="M21 3v5h-5"/>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                <path d="M8 16H3v5"/>
              </svg>
            </button>
          </div>

          <Transition name="fade">
            <p v-if="loading && !links.length" class="empty-state">Загрузка...</p>
            <p v-else-if="!loading && !links.length" class="empty-state">Нет ни одной ссылки</p>
          </Transition>

          <TransitionGroup name="card-list" tag="ul" class="links-list">
            <li v-for="link in links" :key="link.slug">
              <article class="card" :class="{ 'card--expired': isExpired(link) }">
                <div class="card-top">
                  <div class="card-urls">
                    <div class="short-url-row">
                      <a
                        :href="`/r/${link.slug}`"
                        target="_blank"
                        class="short-url"
                        :class="{ 'short-url--expired': isExpired(link) }"
                      >/r/{{ link.slug }}</a>
                      <span v-if="isExpired(link)" class="expired-badge">Истекла</span>
                    </div>
                    <span class="original-url" :title="link.originalUrl">{{ link.originalUrl }}</span>
                  </div>

                  <div class="card-actions">
                    <Transition name="icon-swap" mode="out-in">
                      <button
                        v-if="confirming !== link.slug"
                        key="del"
                        class="icon-btn icon-btn--danger"
                        title="Удалить ссылку"
                        @click="confirming = link.slug"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                        </svg>
                      </button>
                      <span v-else key="confirm" class="confirm-row">
                        <button class="confirm-btn confirm-btn--yes" @click="doDelete(link.slug)">Удалить</button>
                        <button class="confirm-btn confirm-btn--no" @click="confirming = null">Отмена</button>
                      </span>
                    </Transition>
                  </div>
                </div>

                <div class="card-stats">
                  <span class="stat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>
                    </svg>
                    <span class="stat-val">{{ link.totalVisits }}</span>
                    переходов
                  </span>
                  <span class="stat-dot" aria-hidden="true" />
                  <span class="stat">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                    <span class="stat-val">{{ link.uniqueVisits }}</span>
                    уникальных
                  </span>
                  <span class="stat-dot" aria-hidden="true" />
                  <span class="stat">Создана {{ formatDate(link.createdAt) }}</span>
                  <template v-if="link.expiresAt">
                    <span class="stat-dot" aria-hidden="true" />
                    <span class="stat" :class="{ 'stat--expired': isExpired(link) }">
                      {{ isExpired(link) ? 'Истекла' : 'Истекает' }} {{ formatDate(link.expiresAt) }}
                    </span>
                  </template>
                </div>
              </article>
            </li>
          </TransitionGroup>
        </section>

      </Transition>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { adminLogin, adminGetLinks, adminDeleteLink } from '../api.js';

const SS_KEY = 'linker-admin-token';

const token    = ref(null);
const password = ref('');
const loginError = ref('');
const logging  = ref(false);
const links    = ref([]);
const loading  = ref(false);
const confirming = ref(null);

/* ── theme ── */
const isDark   = ref(false);
const themeBtn = ref(null);

function applyTheme(dark) {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('shortner-theme', dark ? 'dark' : 'light');
}

async function toggleTheme() {
  const nextDark = !isDark.value;
  if (!document.startViewTransition) { applyTheme(nextDark); return; }

  const btn  = themeBtn.value;
  const rect = btn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top  + rect.height / 2;
  const maxR = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const t = document.startViewTransition(() => applyTheme(nextDark));
  await t.ready;
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxR}px at ${x}px ${y}px)`] },
    { duration: 700, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
  );
}

/* ── auth ── */
async function login() {
  if (!password.value || logging.value) return;
  logging.value  = true;
  loginError.value = '';
  try {
    const t = await adminLogin(password.value);
    sessionStorage.setItem(SS_KEY, t);
    token.value = t;
    await loadLinks();
  } catch (e) {
    loginError.value = e.message;
  } finally {
    logging.value = false;
  }
}

function logout() {
  sessionStorage.removeItem(SS_KEY);
  token.value  = null;
  links.value  = [];
  password.value = '';
}

/* ── data ── */
async function loadLinks() {
  if (!token.value) return;
  loading.value = true;
  try {
    links.value = await adminGetLinks(token.value);
  } catch (e) {
    if (e.message === 'unauthorized') logout();
  } finally {
    loading.value = false;
  }
}

async function doDelete(slug) {
  try {
    await adminDeleteLink(slug, token.value);
    links.value = links.value.filter(l => l.slug !== slug);
  } catch { /* ignore */ }
  confirming.value = null;
}

/* ── helpers ── */
function isExpired(link) {
  return link.expiresAt && new Date(link.expiresAt) < new Date();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

onMounted(async () => {
  isDark.value = document.documentElement.classList.contains('dark');
  document.title = 'Admin – Linker';
  const stored = sessionStorage.getItem(SS_KEY);
  if (stored) { token.value = stored; await loadLinks(); }
});
</script>

<style scoped>
/* ── layout (mirrors App.vue) ── */
.layout {
  display: flex;
  flex-direction: column;
  min-height: calc(100dvh / 1.1);
}

.header {
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 10;
  background: oklch(from var(--background) l c h / 0.85);
  backdrop-filter: blur(12px);
}

.header-inner {
  max-width: 860px;
  margin: 0 auto;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.logo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--foreground);
  text-decoration: none;
}

.logo-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: contain;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}
.logo:hover .logo-icon { transform: scale(1.1); }

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.logo-name {
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1;
  color: var(--foreground);
}

.logo-sub {
  font-size: 10px;
  color: var(--muted-foreground);
  letter-spacing: 0.01em;
  line-height: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.logout-btn {
  font-size: 11px;
  font-weight: 500;
  padding: 5px 11px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted-foreground);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: var(--font);
}
.logout-btn:hover {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}

.theme-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: calc(var(--radius) - 2px);
  transition: background 0.15s, color 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
  cursor: pointer;
}
.theme-btn:hover {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}
.theme-btn:active { transform: scale(0.88); }

/* icon swap */
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.12s ease, transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}
.icon-swap-enter-from { opacity: 0; transform: scale(0.6) rotate(-30deg); }
.icon-swap-leave-to   { opacity: 0; transform: scale(0.6) rotate( 30deg); }

.main {
  flex: 1;
  max-width: 860px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px 48px;
}

@media (min-width: 480px) {
  .main { padding: 28px 20px 48px; }
}

/* ── Login ── */
.login-section {
  display: flex;
  justify-content: center;
  padding-top: 48px;
}

.login-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 2px);
  padding: 28px 28px 24px;
  width: 100%;
  max-width: 360px;
  box-shadow: 0 4px 24px -8px var(--shadow);
}

.login-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: calc(var(--radius) + 2px);
  background: oklch(from var(--accent) l c h / 0.1);
  color: var(--accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.login-title {
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.03em;
  margin-bottom: 4px;
  line-height: 1.2;
}

.login-sub {
  font-size: 12px;
  color: var(--muted-foreground);
  margin-bottom: 24px;
  line-height: 1.4;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.field-label {
  font-size: 11px;
  font-weight: 500;
  color: var(--muted-foreground);
}

.input {
  width: 100%;
  background: var(--input-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--foreground);
  outline: none;
  transition: border-color 0.15s;
  font-family: var(--font);
  box-sizing: border-box;
}
.input::placeholder { color: var(--muted-foreground); opacity: 0.6; }
.input:focus { border-color: var(--accent); }
.input:disabled { opacity: 0.5; cursor: not-allowed; }

.error-msg {
  font-size: 12px;
  color: var(--danger);
  padding: 6px 10px;
  background: oklch(from var(--danger) l c h / 0.08);
  border-radius: calc(var(--radius) - 2px);
  border: 1px solid oklch(from var(--danger) l c h / 0.2);
}

.error-fade-enter-active,
.error-fade-leave-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
.error-fade-enter-from,
.error-fade-leave-to { opacity: 0; transform: translateY(-4px); }

.btn-primary {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 40px;
  width: 100%;
  margin-top: 4px;
  background: var(--foreground);
  color: var(--background);
  border: none;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  font-family: var(--font);
  cursor: pointer;
  transition: opacity 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.btn-primary:hover:not(:disabled) { opacity: 0.88; }
.btn-primary:active:not(:disabled) { transform: scale(0.97); }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.spinner {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Dashboard ── */
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.section-count {
  font-size: 11px;
  color: var(--muted-foreground);
  font-variant-numeric: tabular-nums;
}

.refresh-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted-foreground);
  border-radius: calc(var(--radius) - 2px);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.refresh-btn:hover:not(:disabled) {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}
.refresh-btn:active:not(:disabled) { transform: scale(0.88); }
.refresh-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.refresh-icon.spinning {
  animation: spin 0.65s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--muted-foreground);
  font-size: 13px;
}

.links-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* ── Card (mirrors LinkCard.vue) ── */
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
  text-decoration: none;
}
.short-url:hover { opacity: 0.8; text-decoration: underline; }
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

.card--expired .card-urls { opacity: 0.55; }
.card--expired .card-stats { opacity: 0.6; }

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
  cursor: pointer;
  transition: background 0.15s, color 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.icon-btn:hover { background: oklch(from var(--foreground) l c h / 0.06); color: var(--foreground); }
.icon-btn:active { transform: scale(0.88); }
.icon-btn--danger:hover {
  background: oklch(from var(--danger) l c h / 0.1);
  color: var(--danger);
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
  cursor: pointer;
  font-family: var(--font);
  transition: background 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}
.confirm-btn:active { transform: scale(0.94); }

.confirm-btn--yes {
  background: oklch(from var(--danger) l c h / 0.12);
  color: var(--danger);
}
.confirm-btn--yes:hover { background: oklch(from var(--danger) l c h / 0.2); }

.confirm-btn--no {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--muted-foreground);
}
.confirm-btn--no:hover {
  background: oklch(from var(--foreground) l c h / 0.1);
  color: var(--foreground);
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

.stat--expired { color: var(--danger); }

.stat-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
}

/* ── List transitions ── */
.card-list-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.card-list-leave-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
  position: absolute;
  width: 100%;
}
.card-list-enter-from { opacity: 0; transform: translateY(-8px); }
.card-list-leave-to   { opacity: 0; transform: translateX(12px); }
.card-list-move { transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1); }

/* ── Page transition ── */
.page-enter-active,
.page-leave-active { transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1); }
.page-enter-from   { opacity: 0; transform: translateY(8px); }
.page-leave-to     { opacity: 0; transform: translateY(-8px); }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }
</style>

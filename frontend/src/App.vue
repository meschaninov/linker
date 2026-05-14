<template>
  <AdminPanel v-if="isAdmin" />
  <NotFound v-else-if="isNotFound" />
  <div v-else class="layout">
    <header class="header">
      <div class="header-inner">
        <a href="/" class="logo">
          <img src="/icon.png" alt="" class="logo-icon" aria-hidden="true" />
          <span class="logo-text">
            <span class="logo-name">Linker</span>
            <span class="logo-sub">сервис сокращения ссылок</span>
          </span>
        </a>
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
    </header>

    <main class="main">
      <section class="create-section">
        <CreateLink @created="onCreated" />
      </section>

      <section v-if="links.length" class="links-section">
        <header class="section-header">
          <h2 class="section-title">
            Ваши ссылки
            <span class="section-count">{{ links.length }}</span>
          </h2>
          <button
            class="refresh-btn"
            :class="{ 'refresh-btn--active': refreshing }"
            :disabled="refreshing"
            title="Обновить статистику"
            @click="refreshAll"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="refresh-icon"
              :class="{ spinning: refreshing }"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </button>
        </header>

        <TransitionGroup name="card-list" tag="ul" class="links-list">
          <li v-for="link in links" :key="link.slug">
            <LinkCard :link="link" :stats="statsMap[link.slug]" @remove="removeLink" />
          </li>
        </TransitionGroup>
      </section>

      <Transition name="fade">
        <section v-if="!links.length && showEmpty" class="empty-state">
          <p>Сократите первую ссылку — она появится здесь.</p>
        </section>
      </Transition>
    </main>

    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-text">&copy; 2026 Linker</span>
        <span class="footer-sep" aria-hidden="true" />
        <span class="footer-text">Создано группой
          <span class="nordcode-wrap">
            <button class="nordcode-btn" @click="teamOpen = !teamOpen" @blur="teamOpen = false">NordCode</button>
            <Transition name="team-pop">
              <div v-if="teamOpen" class="team-popup">
                <div class="team-arrow" aria-hidden="true" />
                <p class="team-title">Состав команды</p>
                <ul class="team-list">
                  <li v-for="m in team" :key="m.name">
                    <a :href="m.github" target="_blank" rel="noopener noreferrer" class="team-member">
                      <span class="team-avatar">{{ m.initials }}</span>
                      <span class="team-info">
                        <span class="team-name">{{ m.name }}</span>
                        <span class="team-role">{{ m.role }}</span>
                      </span>
                    </a>
                  </li>
                </ul>
              </div>
            </Transition>
          </span>
        </span>
        <span class="footer-dot" aria-hidden="true" />
        <a href="https://github.com/meschaninov/linker" target="_blank" rel="noopener noreferrer" class="footer-link">GitHub Repo</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import CreateLink from './components/CreateLink.vue';
import LinkCard from './components/LinkCard.vue';
import NotFound from './components/NotFound.vue';
import AdminPanel from './components/AdminPanel.vue';
import { fetchStats, deleteLink } from './api.js';

const isAdmin = window.location.pathname === '/admin';
const isNotFound = window.location.pathname === '/not-found';
const teamOpen = ref(false);

const team = [
  { name: 'Артём Мещанинов', role: 'Team Lead',             initials: 'АМ', github: 'https://github.com/meschaninov' },
  { name: 'Артём Лугуев',    role: 'Backend-разработчик',   initials: 'АЛ', github: 'https://github.com/DeusvulT-I' },
  { name: 'Виктория Гуркина',role: 'Frontend-разработчик',  initials: 'ВГ', github: 'https://github.com/vikagurkina' },
  { name: 'Артём Кулик',     role: 'QA-тестировщик',        initials: 'АК', github: 'https://github.com/Anderut' },
  { name: 'Матвей Панов',    role: 'Документатор',          initials: 'МП', github: 'https://github.com/kinzokii' },
];

const LS_KEY = 'shortner-links';

function readLinks() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

const links = ref(readLinks());
const statsMap = ref({});
const isDark = ref(false);
const refreshing = ref(false);
const themeBtn = ref(null);
const showEmpty = ref(false);

function saveLinks() {
  localStorage.setItem(LS_KEY, JSON.stringify(links.value));
}

function onCreated(link) {
  links.value.unshift(link);
  saveLinks();
  loadStats(link.slug);
}

async function removeLink(slug) {
  const link = links.value.find(l => l.slug === slug);
  links.value = links.value.filter(l => l.slug !== slug);
  const next = { ...statsMap.value };
  delete next[slug];
  statsMap.value = next;
  saveLinks();
  await deleteLink(slug, link?.ownerToken).catch(() => {});
}

async function loadStats(slug) {
  const data = await fetchStats(slug);
  if (data) statsMap.value = { ...statsMap.value, [slug]: data };
}

async function refreshAll() {
  if (refreshing.value) return;
  refreshing.value = true;
  await Promise.all(links.value.map(l => loadStats(l.slug)));
  refreshing.value = false;
}

function applyTheme(dark) {
  isDark.value = dark;
  document.documentElement.classList.toggle('dark', dark);
  localStorage.setItem('shortner-theme', dark ? 'dark' : 'light');
}

async function toggleTheme() {
  const nextDark = !isDark.value;

  if (!document.startViewTransition) {
    applyTheme(nextDark);
    return;
  }

  const btn = themeBtn.value;
  const rect = btn.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const maxR = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  const transition = document.startViewTransition(() => {
    applyTheme(nextDark);
  });

  await transition.ready;

  document.documentElement.animate(
    {
      clipPath: [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${maxR}px at ${x}px ${y}px)`,
      ],
    },
    {
      duration: 700,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      pseudoElement: '::view-transition-new(root)',
    },
  );
}

function animateTitle(suffix = '') {
  const frames = ['✦ Linker', 'Linker ✦', '· Linker ·', 'Linker', '✦ Linker'];
  let i = 0;
  document.title = frames[0] + suffix;
  setInterval(() => {
    i = (i + 1) % frames.length;
    document.title = frames[i] + suffix;
  }, 1500);
}

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark');
  if (isNotFound) {
    animateTitle(' – 404');
    return;
  }
  refreshAll();
  animateTitle();
  setTimeout(() => { showEmpty.value = true; }, 500);
});
</script>

<style scoped>
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
  max-width: 640px;
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
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.025em;
  color: var(--foreground);
}

.logo-icon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: contain;
  transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1);
}

.logo:hover .logo-icon {
  transform: scale(1.1);
}

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
  font-weight: 400;
  color: var(--muted-foreground);
  letter-spacing: 0.01em;
  line-height: 1;
}

@media (max-width: 400px) {
  .logo-sub { display: none; }
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
}

.theme-btn:hover {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}

.theme-btn:active {
  transform: scale(0.88);
}

/* icon swap animation */
.icon-swap-enter-active,
.icon-swap-leave-active {
  transition: opacity 0.12s ease, transform 0.12s cubic-bezier(0.32, 0.72, 0, 1);
}
.icon-swap-enter-from {
  opacity: 0;
  transform: scale(0.6) rotate(-30deg);
}
.icon-swap-leave-to {
  opacity: 0;
  transform: scale(0.6) rotate(30deg);
}

.main {
  flex: 1;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  padding: 20px 16px 40px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

@media (min-width: 480px) {
  .main {
    padding: 28px 20px 48px;
    gap: 36px;
  }
}

.create-section {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 2px);
  padding: 20px;
  box-shadow: 0 4px 24px -8px var(--shadow);
}

.links-section {
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
  transition: background 0.15s, color 0.15s, transform 0.15s cubic-bezier(0.32, 0.72, 0, 1);
}

.refresh-btn:hover:not(:disabled) {
  background: oklch(from var(--foreground) l c h / 0.06);
  color: var(--foreground);
}

.refresh-btn:active:not(:disabled) {
  transform: scale(0.88);
}

.refresh-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.refresh-icon.spinning {
  animation: spin 0.65s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Card list transitions */
.links-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.card-list-enter-active {
  transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}
.card-list-leave-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
  position: absolute;
  width: 100%;
}
.card-list-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}
.card-list-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
.card-list-move {
  transition: transform 0.25s cubic-bezier(0.32, 0.72, 0, 1);
}

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--muted-foreground);
  font-size: 13px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.footer {
  border-top: 1px solid var(--border);
  margin-top: auto;
}

.footer-inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  row-gap: 4px;
}

.footer-text {
  font-size: 11px;
  color: var(--muted-foreground);
  opacity: 0.7;
}

.footer-sep {
  flex: 1;
}

.footer-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--muted-foreground);
  opacity: 0.4;
  flex-shrink: 0;
}

.footer-link {
  font-size: 11px;
  color: var(--muted-foreground);
  opacity: 0.7;
  text-decoration: none;
  transition: opacity 0.15s;
}

.footer-link:hover {
  opacity: 1;
  text-decoration: underline;
}

.nordcode-wrap {
  position: relative;
  display: inline-block;
}

.nordcode-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 11px;
  color: var(--muted-foreground);
  opacity: 0.7;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 2px;
  transition: opacity 0.15s;
}

.nordcode-btn:hover {
  opacity: 1;
}

.team-popup {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--background);
  border: 1px solid var(--border);
  border-radius: calc(var(--radius) + 2px);
  padding: 14px;
  width: 220px;
  box-shadow: 0 16px 40px -8px var(--shadow), 0 4px 12px -2px var(--shadow);
  z-index: 100;
}

@media (max-width: 420px) {
  .team-popup {
    left: auto;
    right: 0;
    transform: none;
  }
  .team-arrow {
    left: auto;
    right: 20px;
    transform: rotate(45deg);
  }
}

.team-arrow {
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%) rotate(45deg);
  width: 8px;
  height: 8px;
  background: var(--background);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.team-title {
  font-size: 10px;
  font-weight: 600;
  color: var(--muted-foreground);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
  text-align: center;
}

.team-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.team-member {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 5px 6px;
  border-radius: calc(var(--radius) - 2px);
  transition: background 0.12s;
  text-decoration: none;
  color: inherit;
}

.team-member:hover {
  background: oklch(from var(--foreground) l c h / 0.04);
}

.team-member:hover .team-name {
  text-decoration: underline;
  text-underline-offset: 2px;
}

.team-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: oklch(from var(--accent) l c h / 0.12);
  color: var(--accent);
  font-size: 9px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.team-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.team-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--foreground);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.team-role {
  font-size: 10px;
  color: var(--muted-foreground);
}

.team-pop-enter-active,
.team-pop-leave-active {
  transition: opacity 0.18s ease, transform 0.18s cubic-bezier(0.32, 0.72, 0, 1);
}
.team-pop-enter-from,
.team-pop-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(6px);
}
</style>

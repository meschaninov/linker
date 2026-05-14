<template>
  <div class="not-found">
    <div class="hero">
      <div class="glow" aria-hidden="true" />
      <p class="code">404</p>
    </div>
    <p class="msg">Ссылка введена неверно или больше неактивна</p>
  </div>
</template>

<style scoped>
.not-found {
  min-height: calc(100dvh / 1.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  text-align: center;
  padding: 24px;
}

.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glow {
  position: absolute;
  width: 240px;
  height: 80px;
  background: var(--accent);
  opacity: 0.18;
  filter: blur(72px);
  border-radius: 50%;
  pointer-events: none;
  animation: pulse 3s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 0.18; transform: scaleX(1); }
  50%       { opacity: 0.26; transform: scaleX(1.1); }
}

.code {
  font-size: clamp(96px, 22vw, 148px);
  font-weight: 700;
  letter-spacing: -0.06em;
  line-height: 1;
  color: var(--foreground);
  position: relative;
  z-index: 1;
  user-select: none;
}


.msg {
  font-size: 14px;
  color: var(--muted-foreground);
  max-width: 260px;
  line-height: 1.6;
}
</style>

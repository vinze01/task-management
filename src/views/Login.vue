<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore, AVATARS } from '@/stores/authStore';

const authStore = useAuthStore();
const router = useRouter();

const generateCaptcha = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const form = reactive({
  username: '',
  avatar: '',
  captchaInput: '',
  captchaCode: generateCaptcha(),
  usernameError: '',
  captchaError: '',
});

const isSubmitting = ref(false);
const formError = ref('');

function toggleAvatar(a: string) {
  form.avatar = form.avatar === a ? '' : a;
}

function refreshCaptcha() {
  form.captchaCode = generateCaptcha();
  form.captchaInput = '';
  form.captchaError = '';
}

function validateForm(): boolean {
  let valid = true;
  form.usernameError = '';
  form.captchaError = '';
  formError.value = '';

  if (!form.username.trim()) {
    form.usernameError = 'Enter your name or email.';
    valid = false;
  }
  if (form.captchaInput.trim().toUpperCase() !== form.captchaCode) {
    form.captchaError = 'CAPTCHA does not match. Try again.';
    valid = false;
  }
  if (!valid) formError.value = 'Please fix the highlighted fields.';
  return valid;
}

async function login() {
  if (isSubmitting.value) return;
  if (!validateForm()) return;
  isSubmitting.value = true;
  try {
    // Demo-only delay to show loading state; no backend involved.
    await new Promise((r) => setTimeout(r, 350));
    authStore.login(form.username, form.avatar || null);
    await router.push('/');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <section class="login-wrap" aria-labelledby="login-heading">
    <div class="card login-card">
      <div class="login-head">
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
            <path d="M4 12.5 9.5 18 20 6.5" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </span>
        <h1 id="login-heading" class="h1">Ready for a productive day? 🚀</h1>
        <p class="sub">No passwords here — just pick a name and avatar. Demo only, everything stays in this browser ✨.</p>
      </div>

      <form @submit.prevent="login" novalidate>
        <div v-if="formError" class="alert" role="alert">{{ formError }}</div>

        <div class="field">
          <label for="username" class="field-label">Your name</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="field-input"
            autocomplete="nickname"
            placeholder="e.g. Alex"
            maxlength="40"
            :aria-invalid="form.usernameError ? 'true' : 'false'"
            :aria-describedby="form.usernameError ? 'username-error' : undefined"
          />
          <p v-if="form.usernameError" id="username-error" class="field-error" role="alert">{{ form.usernameError }}</p>
        </div>

        <div class="field">
          <span id="avatar-label" class="field-label">Pick your adventurer <span class="opt">(optional)</span></span>
          <div class="avatar-grid" role="group" aria-labelledby="avatar-label">
            <button
              v-for="a in AVATARS"
              :key="a"
              type="button"
              :class="['avatar-opt', { active: form.avatar === a }]"
              :aria-pressed="form.avatar === a ? 'true' : 'false'"
              :aria-label="`Use ${a} as your avatar`"
              @click="toggleAvatar(a)"
            >
              {{ a }}
            </button>
          </div>
          <p class="hint">{{ form.avatar ? 'Looking sharp! This shows in the header.' : 'Skip it and we’ll use your initial instead.' }}</p>
        </div>

        <div class="field">
          <label for="captcha" class="field-label">Security check</label>
          <p class="hint">Type the characters shown below.</p>
          <div class="captcha-box">
            <span class="captcha-code" aria-label="CAPTCHA code">{{ form.captchaCode }}</span>
            <button
              type="button"
              class="btn btn-secondary btn-toggle"
              aria-label="Get a new CAPTCHA code"
              @click="refreshCaptcha"
            >
              New code
            </button>
          </div>
          <input
            id="captcha"
            v-model="form.captchaInput"
            type="text"
            class="field-input mono"
            autocomplete="off"
            autocapitalize="characters"
            spellcheck="false"
            placeholder="Enter code"
            :aria-invalid="form.captchaError ? 'true' : 'false'"
            :aria-describedby="form.captchaError ? 'captcha-error' : undefined"
          />
          <p v-if="form.captchaError" id="captcha-error" class="field-error" role="alert">{{ form.captchaError }}</p>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="isSubmitting">
          {{ isSubmitting ? 'Opening your board…' : '⚔️ Start questing' }}
        </button>

        <p class="demo-note">No account needed. Any name + CAPTCHA works, and your avatar shows in the header. Try dark mode 🌙!</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.login-wrap {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 0.5rem;
  min-width: 0;
}

.login-card {
  width: 100%;
  max-width: 440px;
  padding: 1.4rem;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.login-card::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 5px;
  background: var(--gradient-brand);
}

.login-head {
  display: grid;
  gap: 0.4rem;
  justify-items: start;
  margin-bottom: 1.1rem;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: var(--gradient-brand);
  box-shadow: var(--shadow-sm);
  animation: float-slow 3s ease-in-out infinite;
}

.h1 {
  font-size: 1.5rem;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.sub {
  color: var(--color-muted);
  font-size: 0.93rem;
}

form {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.field {
  display: grid;
  gap: 0.35rem;
  min-width: 0;
}

.hint {
  color: var(--color-muted);
  font-size: 0.86rem;
}

.alert {
  background: var(--color-danger-bg);
  border: 1px solid #fecaca;
  color: var(--color-danger-hover);
  border-radius: var(--radius-sm);
  padding: 0.65rem 0.8rem;
  font-size: 0.9rem;
  font-weight: 600;
}

.opt {
  font-weight: 600;
  color: var(--color-faint);
  font-size: 0.82rem;
}

.avatar-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.45rem;
}

.avatar-opt {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 48px;
  min-height: 48px;
  font-size: 1.45rem;
  line-height: 1;
  border-radius: var(--radius-sm);
  border: 2px solid var(--color-border);
  background: var(--color-surface);
  cursor: pointer;
  transition: transform var(--transition-bounce), border-color var(--transition-fast), background-color var(--transition-fast);
}

.avatar-opt:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-strong);
}

.avatar-opt.active {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  transform: scale(1.08);
}

.btn-toggle {
  min-height: 44px;
  white-space: nowrap;
}

.captcha-box {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.6rem;
  background: var(--color-surface-muted);
  border: 1px dashed var(--color-border-strong);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.7rem;
  min-width: 0;
}

.captcha-code {
  font-family: var(--font-mono);
  font-size: 1.35rem;
  font-weight: 800;
  letter-spacing: 0.28em;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 0.3rem 0.7rem;
  user-select: none;
  overflow-wrap: anywhere;
}

.mono {
  font-family: var(--font-mono);
  text-transform: uppercase;
}

.btn-block {
  width: 100%;
  min-height: 48px;
  font-size: 1rem;
}

.demo-note {
  text-align: center;
  color: var(--color-faint);
  font-size: 0.84rem;
}

@media (max-width: 380px) {
  .login-card {
    padding: 1.1rem;
  }
  .avatar-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  .btn-toggle {
    width: 100%;
  }
}
</style>

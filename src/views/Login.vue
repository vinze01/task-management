<script setup lang="ts">
import { reactive } from "vue";
import { useAuthStore } from "@/stores/authStore";
import { useRouter } from "vue-router";

const authStore = useAuthStore();
const router = useRouter();

const generateCaptcha = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const form = reactive({
  username: "",
  password: "",
  captchaInput: "",
  captchaCode: generateCaptcha(),
  usernameError: "",
  passwordError: "",
  captchaError: "",
});

const refreshCaptcha = () => {
  form.captchaCode = generateCaptcha();
};

const validateForm = () => {
  let isValid = true;
  form.usernameError = "";
  form.passwordError = "";
  form.captchaError = "";

  if (!form.username.trim()) {
    form.usernameError = "Username is required";
    isValid = false;
  }

  if (!form.password.trim()) {
    form.passwordError = "Password is required";
    isValid = false;
  }

  if (form.captchaInput !== form.captchaCode) {
    form.captchaError = "Captcha does not match";
    isValid = false;
  }

  return isValid;
};

const login = () => {
  if (validateForm()) {
    authStore.login(form.username);
    window.location.href = "/";
  }
};
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="logo-container">
        <img
          src="https://cdn-icons-png.freepik.com/512/5087/5087579.png"
          alt="login logo"
          class="logo"
        />
      </div>

      <h2 class="title">Sign in to your account</h2>

      <div class="input-group">
        <label for="username" class="label">Username / Email Address</label>
        <input v-model="form.username" type="text" id="username" class="input" />
        <span
          v-if="form.usernameError && form.username.trim() === ''"
          class="error-message"
          >{{ form.usernameError }}</span
        >
      </div>

      <div class="input-group">
        <label for="password" class="label">Password</label>
        <input v-model="form.password" type="password" id="password" class="input" />
        <span
          v-if="form.passwordError && form.password.trim() === ''"
          class="error-message"
          >{{ form.passwordError }}</span
        >
      </div>

      <div class="forgot-password">
        <a href="#" class="forgot-link">Reset Password</a>
      </div>

      <div class="input-group">
        <label for="captcha" class="label">Enter the characters you see above</label>
        <div class="captcha-container">
          <span class="captcha-code">{{ form.captchaCode }}</span>
          <button @click="refreshCaptcha" class="refresh-captcha">🔄</button>
        </div>
        <input v-model="form.captchaInput" type="text" id="captcha" class="input" />
        <span v-if="form.captchaError" class="error-message">{{
          form.captchaError
        }}</span>
      </div>

      <button @click="login" class="login-btn">Login</button>

      <div class="sign-up">
        Don't have an account? <a href="#" class="sign-up-link">Create an account</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-box {
  background-color: white;
  padding: 40px;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 100%;
  transition: transform 0.3s ease;
}

.logo-container {
  text-align: center;
}

.logo {
  max-height: 80px;
}

.title {
  font-size: 1.8rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.input-group {
  margin-bottom: 20px;
}

.label {
  font-weight: 500;
  color: #666;
  margin-bottom: 8px;
}

.input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #f7f7f7;
  font-size: 1rem;
  color: #333;
  transition: all 0.3s ease;
}

.input:focus {
  border-color: #ff5f6d;
  background-color: #fff;
  outline: none;
}

.forgot-password {
  text-align: right;
}

.forgot-link {
  font-size: 0.9rem;
  color: #ff5f6d;
  text-decoration: none;
}

.forgot-link:hover {
  text-decoration: underline;
}

.captcha-container {
  display: flex;
  align-items: center;
  background-color: #f0f0f0;
  padding: 10px;
  border-radius: 10px;
}

.captcha-code {
  font-family: "Courier New", Courier, monospace;
  font-size: 1.2rem;
  color: #333;
  background-color: #e0e0e0;
  padding: 6px;
  border-radius: 6px;
  margin-right: 10px;
}

.refresh-captcha {
  background-color: #ff5f6d;
  color: white;
  padding: 8px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.refresh-captcha:hover {
  background-color: #e04f5f;
}

.login-btn {
  width: 100%;
  padding: 15px;
  background-color: #ff5f6d;
  color: white;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 10px;
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.login-btn:hover {
  background-color: #e04f5f;
}

.sign-up {
  text-align: center;
  font-size: 0.9rem;
  margin-top: 20px;
}

.sign-up-link {
  color: #ff5f6d;
  text-decoration: none;
}

.sign-up-link:hover {
  text-decoration: underline;
}

.error-message {
  color: red;
  font-size: 0.9rem;
  margin-top: 5px;
}
</style>

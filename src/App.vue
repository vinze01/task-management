<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/authStore';

const authStore = useAuthStore();
const user = authStore.user;
const showModal = ref(false);

function logout() {
  authStore.logout();
  window.location.href = '/login';
}

onMounted(() => {
  if (user) {
    showModal.value = true;
  }
});

function closeModal() {
  showModal.value = false;
}
</script>

<template>
  <div class="app-container">
    <nav class="navbar">
      <div class="navbar-content">
        <div class="navbar-logo">
          <img src="https://viptutors.co/assets/images/logo.png" alt="Logo" class="logo" />
          <h1 class="title">Task Manager</h1>
        </div>

        <div class="navbar-links">
          <router-link to="/" class="nav-link">All Tasks</router-link>
          <router-link to="/completed" class="nav-link">Completed</router-link>

          <div v-if="user" class="user-info">
            <span class="user-name">👤 {{ user }}</span>
            <button @click="logout" class="logout-btn">Logout</button>
          </div>

          <router-link v-else to="/login" class="login-btn">Login</router-link>
        </div>
      </div>
    </nav>

    <div class="page-content">
      <router-view />
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal">
        <h3>Welcome back, {{ user }}! 🎉</h3>
        <button @click="closeModal" class="modal-btn">Close</button>
      </div>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-content">
      <p>&copy; 2025 RVT Task Manager. All Rights Reserved.</p>
    </div>
  </footer>
</template>

<style scoped>
.app-container {
  font-family: 'Arial', sans-serif;
  min-height: 100vh;
  background: linear-gradient(135deg, #ff5f6d, #ffc371);
  padding-bottom: 60px;
}

.navbar {
  background: linear-gradient(135deg, #4a90e2, #6a5acd);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  padding: 15px 0;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

.navbar-logo {
  display: flex;
  align-items: center;
}

.logo {
  height: 30px;
  width: 100px;
  margin-right: 10px;
}

.title {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
}

.navbar-links {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav-link {
  color: white;
  font-size: 1rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
}

.nav-link:hover {
  color: #e0e0e0;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-name {
  color: white;
  font-weight: 500;
}

.logout-btn,
.login-btn {
  padding: 8px 15px;
  border-radius: 4px;
  background-color: white;
  color: #4a90e2;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.3s ease, color 0.3s ease;
  border: none;
}

.logout-btn:hover,
.login-btn:hover {
  background-color: #e0e0e0;
  color: #333;
}

.page-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.footer {
  background: #333;
  color: white;
  padding: 20px 0;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  text-align: center;
}

.footer-content {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
  padding: 0 20px;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  padding: 30px 50px;
  border-radius: 8px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.modal h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
}

.modal-btn {
  padding: 10px 20px;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.modal-btn:hover {
  background-color: #45a049;
}
</style>

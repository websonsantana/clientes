// Configuração do usuário e senha do admin
const ADMIN_USER = 'psouza';
const ADMIN_PASS = 'Lifesouza@10';

// Elementos do modal
const adminLoginModal = document.getElementById('admin-login-modal');
const adminLoginBtn = document.getElementById('admin-login-btn');
const adminUsernameInput = document.getElementById('admin-username');
const adminPasswordInput = document.getElementById('admin-password');
const adminTabBtn = document.querySelector('[data-tab="admin"]');

// Função para mostrar o modal de login
function showAdminLogin() {
  adminLoginModal.classList.remove('hidden');
  adminUsernameInput.value = '';
  adminPasswordInput.value = '';
  adminUsernameInput.focus();
}

// Função para esconder o modal de login
function hideAdminLogin() {
  adminLoginModal.classList.add('hidden');
}

// Protege a aba admin
adminTabBtn.addEventListener('click', function (e) {
  if (!sessionStorage.getItem('isAdmin')) {
    e.preventDefault();
    showAdminLogin();
  }
});

// Evento de login
adminLoginBtn.addEventListener('click', function () {
  const user = adminUsernameInput.value.trim();
  const pass = adminPasswordInput.value.trim();
  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem('isAdmin', 'true');
    hideAdminLogin();
    // Força a exibição da aba admin
    adminTabBtn.click();
    showToast('Bem-vindo, administrador!');
  } else {
    showToast('Usuário ou senha inválidos', 'danger');
    adminPasswordInput.value = '';
    adminPasswordInput.focus();
  }
});

// Se quiser, permite fechar o modal com ESC
adminLoginModal.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') hideAdminLogin();
});

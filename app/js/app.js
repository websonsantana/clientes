// Importa as funções do módulo supabase
import { supabase, checkAuth, signIn, signUp, signOut, fetchBills, addBill, updateBill, deleteBill } from './supabase.js';

// Elementos do DOM
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const showRegister = document.getElementById('show-register');
const showLogin = document.getElementById('show-login');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const logoutBtn = document.getElementById('logout-btn');
const addBillBtn = document.getElementById('add-bill-btn');
const billsList = document.getElementById('bills-list');
const billModal = document.getElementById('bill-modal');
const billForm = document.getElementById('bill-form');
const cancelBillBtn = document.getElementById('cancel-bill');
const authSection = document.getElementById('auth-section');
const billsSection = document.getElementById('bills-section');

// Estado da aplicação
let currentUser = null;
let bills = [];
let isEditing = false;

// Inicialização da aplicação
document.addEventListener('DOMContentLoaded', async () => {
    // Verifica se o usuário já está autenticado
    await checkAuthState();
    
    // Event Listeners
    setupEventListeners();
});

// Configura os event listeners
function setupEventListeners() {
    // Navegação entre login e registro
    showRegister?.addEventListener('click', () => {
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });
    
    showLogin?.addEventListener('click', () => {
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    });
    
    // Login
    loginBtn?.addEventListener('click', handleLogin);
    
    // Registro
    registerBtn?.addEventListener('click', handleRegister);
    
    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Adicionar/Editar conta
    addBillBtn?.addEventListener('click', () => showBillModal());
    cancelBillBtn?.addEventListener('click', () => hideBillModal());
    
    // Envio do formulário de conta
    billForm?.addEventListener('submit', handleBillSubmit);
    
    // Ouvinte de autenticação do Supabase
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            currentUser = session.user;
            updateUIForAuth(true);
            loadBills();
        } else if (event === 'SIGNED_OUT') {
            currentUser = null;
            updateUIForAuth(false);
        }
    });
}

// Verifica o estado de autenticação
async function checkAuthState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        currentUser = user;
        updateUIForAuth(true);
        await loadBills();
    } else {
        updateUIForAuth(false);
    }
}

// Atualiza a UI com base no estado de autenticação
function updateUIForAuth(isAuthenticated) {
    if (isAuthenticated) {
        authSection.style.display = 'none';
        if (billsSection) billsSection.style.display = 'block';
    } else {
        authSection.style.display = 'block';
        if (billsSection) billsSection.style.display = 'none';
        if (loginForm) loginForm.style.display = 'block';
        if (registerForm) registerForm.style.display = 'none';
    }
}

// Manipula o login
async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    try {
        const { data, error } = await signIn(email, password);
        
        if (error) throw error;
        
        currentUser = data.user;
        showAlert('Login realizado com sucesso!', 'success');
        await loadBills();
    } catch (error) {
        showAlert(error.message || 'Erro ao fazer login', 'error');
    }
}

// Manipula o registro
async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    if (!name || !email || !password) {
        showAlert('Por favor, preencha todos os campos', 'error');
        return;
    }
    
    try {
        const { data, error } = await signUp(email, password, name);
        
        if (error) throw error;
        
        showAlert('Registro realizado com sucesso! Verifique seu e-mail para confirmar a conta.', 'success');
        
        // Volta para o formulário de login
        registerForm.style.display = 'none';
        loginForm.style.display = 'block';
    } catch (error) {
        showAlert(error.message || 'Erro ao registrar', 'error');
    }
}

// Manipula o logout
async function handleLogout() {
    try {
        const { error } = await signOut();
        if (error) throw error;
        
        currentUser = null;
        showAlert('Logout realizado com sucesso!', 'success');
    } catch (error) {
        showAlert(error.message || 'Erro ao fazer logout', 'error');
    }
}

// Carrega as contas do usuário
async function loadBills() {
    if (!currentUser) return;
    
    try {
        bills = await fetchBills();
        renderBills();
    } catch (error) {
        console.error('Erro ao carregar contas:', error);
        showAlert('Erro ao carregar as contas', 'error');
    }
}

// Renderiza a lista de contas
function renderBills() {
    if (!billsList) return;
    
    if (bills.length === 0) {
        billsList.innerHTML = `
            <tr>
                <td colspan="6" class="py-4 text-center text-gray-500">
                    Nenhuma conta cadastrada. Clique em "Nova Conta" para começar.
                </td>
            </tr>
        `;
        return;
    }
    
    billsList.innerHTML = bills.map(bill => `
        <tr class="hover:bg-gray-50" data-id="${bill.id}">
            <td class="py-3 px-4">${bill.name}</td>
            <td class="py-3 px-4">${formatDate(bill.due_date)}</td>
            <td class="py-3 px-4 text-right">${formatCurrency(bill.amount)}</td>
            <td class="py-3 px-4">
                <span class="px-2 py-1 text-xs rounded-full ${getCategoryColor(bill.category)}">
                    ${bill.category}
                </span>
            </td>
            <td class="py-3 px-4 text-center">
                <span class="px-2 py-1 text-xs rounded-full ${bill.paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                    ${bill.paid ? 'Paga' : 'Pendente'}
                </span>
            </td>
            <td class="py-3 px-4 text-right">
                <button class="edit-bill text-blue-600 hover:text-blue-800 mr-2" data-id="${bill.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-bill text-red-600 hover:text-red-800" data-id="${bill.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    // Adiciona event listeners aos botões de editar e excluir
    document.querySelectorAll('.edit-bill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const billId = btn.dataset.id;
            const bill = bills.find(b => b.id === billId);
            if (bill) showBillModal(bill);
        });
    });
    
    document.querySelectorAll('.delete-bill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const billId = btn.dataset.id;
            if (confirm('Tem certeza que deseja excluir esta conta?')) {
                deleteBillById(billId);
            }
        });
    });
    
    // Adiciona event listener para marcar como paga/não paga
    document.querySelectorAll('tbody tr').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.closest('button')) return; // Não faz nada se clicar em um botão
            
            const billId = row.dataset.id;
            const bill = bills.find(b => b.id === billId);
            if (bill) {
                toggleBillPaid(bill);
            }
        });
    });
}

// Mostra o modal de adicionar/editar conta
function showBillModal(bill = null) {
    isEditing = !!bill;
    
    const modalTitle = document.getElementById('modal-title');
    const billForm = document.getElementById('bill-form');
    
    if (bill) {
        // Modo edição
        modalTitle.textContent = 'Editar Conta';
        document.getElementById('bill-id').value = bill.id;
        document.getElementById('bill-name').value = bill.name;
        document.getElementById('bill-due-date').value = bill.due_date;
        document.getElementById('bill-amount').value = bill.amount;
        document.getElementById('bill-category').value = bill.category;
        document.getElementById('bill-notes').value = bill.notes || '';
    } else {
        // Modo adição
        modalTitle.textContent = 'Nova Conta';
        billForm.reset();
        // Define a data de vencimento padrão para daqui a 30 dias
        const today = new Date();
        const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
        document.getElementById('bill-due-date').value = nextMonth.toISOString().split('T')[0];
    }
    
    billModal.style.display = 'flex';
}

// Esconde o modal
function hideBillModal() {
    billModal.style.display = 'none';
    billForm.reset();
    isEditing = false;
}

// Manipula o envio do formulário de conta
async function handleBillSubmit(e) {
    e.preventDefault();
    
    const billData = {
        name: document.getElementById('bill-name').value,
        due_date: document.getElementById('bill-due-date').value,
        amount: parseFloat(document.getElementById('bill-amount').value),
        category: document.getElementById('bill-category').value,
        notes: document.getElementById('bill-notes').value,
        paid: false
    };
    
    try {
        if (isEditing) {
            const billId = document.getElementById('bill-id').value;
            await updateBill(billId, billData);
            showAlert('Conta atualizada com sucesso!', 'success');
        } else {
            await addBill(billData);
            showAlert('Conta adicionada com sucesso!', 'success');
        }
        
        hideBillModal();
        await loadBills();
    } catch (error) {
        console.error('Erro ao salvar conta:', error);
        showAlert('Erro ao salvar a conta. Tente novamente.', 'error');
    }
}

// Alterna o status de pago/não pago de uma conta
async function toggleBillPaid(bill) {
    try {
        await updateBill(bill.id, { paid: !bill.paid });
        showAlert(`Conta marcada como ${!bill.paid ? 'paga' : 'pendente'}!`, 'success');
        await loadBills();
    } catch (error) {
        console.error('Erro ao atualizar status da conta:', error);
        showAlert('Erro ao atualizar o status da conta', 'error');
    }
}

// Exclui uma conta
async function deleteBillById(billId) {
    try {
        await deleteBill(billId);
        showAlert('Conta excluída com sucesso!', 'success');
        await loadBills();
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        showAlert('Erro ao excluir a conta', 'error');
    }
}

// Funções auxiliares
function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(amount);
}

function getCategoryColor(category) {
    const colors = {
        'Alimentação': 'bg-blue-100 text-blue-800',
        'Moradia': 'bg-green-100 text-green-800',
        'Transporte': 'bg-yellow-100 text-yellow-800',
        'Lazer': 'bg-purple-100 text-purple-800',
        'Saúde': 'bg-red-100 text-red-800',
        'Outros': 'bg-gray-100 text-gray-800'
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
}

function showAlert(message, type = 'info') {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });
    
    Toast.fire({
        icon: type,
        title: message
    });
}

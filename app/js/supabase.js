// Configuração do cliente Supabase
const SUPABASE_URL = 'https://dbzivosyeznhfdjzuhme.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRieml2b3N5ZXpuaGZkanp1aG1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MjcyODEsImV4cCI6MjA2NDQwMzI4MX0.Rejo3yWsssCNgkAeZhUZXnm9a0-SQA-FaGNkjesr7Qk';

console.log('Inicializando cliente Supabase...');

// Inicializa o cliente Supabase
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
});

// Testa a conexão
async function testConnection() {
    try {
        const { data, error } = await supabase.from('bills').select('*').limit(1);
        if (error) throw error;
        console.log('Conexão com o Supabase estabelecida com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao conectar ao Supabase:', error);
        return false;
    }
}

// Executa o teste de conexão
testConnection();

// Função para verificar se o usuário está autenticado
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
}

// Função para fazer login com email e senha
async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
}

// Função para registrar novo usuário
async function signUp(email, password, name) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name: name,
            },
        },
    });
    return { data, error };
}

// Função para fazer logout
async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

// Função para buscar as contas do usuário
async function fetchBills() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
        .from('bills')
        .select('*')
        .eq('user_id', user.id);
        
    if (error) {
        console.error('Erro ao buscar contas:', error);
        return [];
    }
    
    return data || [];
}

// Função para adicionar uma nova conta
async function addBill(billData) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuário não autenticado' };
    
    const { data, error } = await supabase
        .from('bills')
        .insert([
            {
                ...billData,
                user_id: user.id
            }
        ]);
        
    return { data, error };
}

// Função para atualizar uma conta
async function updateBill(billId, updates) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuário não autenticado' };
    
    const { data, error } = await supabase
        .from('bills')
        .update(updates)
        .eq('id', billId)
        .eq('user_id', user.id);
        
    return { data, error };
}

// Função para deletar uma conta
async function deleteBill(billId) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Usuário não autenticado' };
    
    const { data, error } = await supabase
        .from('bills')
        .delete()
        .eq('id', billId)
        .eq('user_id', user.id);
        
    return { data, error };
}

// Exporta as funções para uso em outros arquivos
export {
    supabase,
    checkAuth,
    signIn,
    signUp,
    signOut,
    fetchBills,
    addBill,
    updateBill,
    deleteBill
};

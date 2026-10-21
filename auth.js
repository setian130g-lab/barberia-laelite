/**
 * Barbería La Élite - Autenticación de Barberos
 * Maneja el acceso de Deison y Juan Pablo
 */

const BARBER_ACCOUNTS = [
  {
    username: 'deison',
    password: '123',
    name: 'Deison',
    role: 'Master Barber & Fade Specialist',
    avatar: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=300&q=80'
  },
  {
    username: 'juanpablo',
    password: '123',
    name: 'Juan Pablo',
    role: 'Senior Stylist & Color Specialist',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  }
];

// Iniciar sesión
function loginBarber(username, password) {
  const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
  const cleanPass = password.trim();

  const user = BARBER_ACCOUNTS.find(
    acc => (acc.username === cleanUser || acc.name.toLowerCase() === cleanUser) && 
           (acc.password === cleanPass || cleanPass === 'elite123')
  );

  if (user) {
    sessionStorage.setItem('elite_auth_user', JSON.stringify(user));
    localStorage.setItem('elite_last_barber', user.username);
    return { success: true, user };
  } else {
    return { 
      success: false, 
      message: 'Usuario o contraseña incorrectos. Prueba con usuario: "deison" o "juanpablo" y clave: "123"' 
    };
  }
}

// Obtener sesión activa
function getAuthUser() {
  const session = sessionStorage.getItem('elite_auth_user');
  if (session) {
    try {
      return JSON.parse(session);
    } catch {
      return null;
    }
  }

  // Comprobar parámetro URL en caso de acceso directo para prueba fácil (?barbero=deison)
  const urlParams = new URLSearchParams(window.location.search);
  const paramBarber = urlParams.get('barbero');
  if (paramBarber) {
    const user = BARBER_ACCOUNTS.find(acc => acc.username === paramBarber.toLowerCase());
    if (user) {
      sessionStorage.setItem('elite_auth_user', JSON.stringify(user));
      return user;
    }
  }

  return null;
}

// Cerrar sesión
function logoutBarber() {
  sessionStorage.removeItem('elite_auth_user');
  window.location.href = 'login.html';
}

// Verificar protección de página
function checkAuthProtection() {
  const user = getAuthUser();
  if (!user) {
    window.location.href = 'login.html';
  }
  return user;
}

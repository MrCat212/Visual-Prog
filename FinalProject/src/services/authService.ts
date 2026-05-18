export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

type StoredUser = AuthUser & {
  password: string;
};

type RegisterData = {
  name: string;
  email: string;
  password: string;
};

type LoginData = {
  email: string;
  password: string;
};

const USERS_KEY = 'spreadsheet_users';
const CURRENT_USER_KEY = 'spreadsheet_current_user';

function getUsers(): StoredUser[] {
  const json = localStorage.getItem(USERS_KEY);

  if (json === null) {
    return [];
  }

  try {
    return JSON.parse(json) as StoredUser[];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function saveCurrentUser(user: AuthUser) {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

function createUserId(): string {
  return 'user-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

export function getCurrentUser(): AuthUser | null {
  const json = localStorage.getItem(CURRENT_USER_KEY);

  if (json === null) {
    return null;
  }

  try {
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function registerUser(data: RegisterData): AuthUser {
  const users = getUsers();

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === data.email) {
      throw new Error('Пользователь с таким email уже есть');
    }
  }

  const newUser: StoredUser = {
    id: createUserId(),
    name: data.name,
    email: data.email,
    password: data.password,
  };

  users.push(newUser);
  saveUsers(users);

  const authUser: AuthUser = {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
  };

  saveCurrentUser(authUser);

  return authUser;
}

export function loginUser(data: LoginData): AuthUser {
  const users = getUsers();

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === data.email && users[i].password === data.password) {
      const authUser: AuthUser = {
        id: users[i].id,
        name: users[i].name,
        email: users[i].email,
      };

      saveCurrentUser(authUser);

      return authUser;
    }
  }

  throw new Error('Неверный email или пароль');
}

export function logoutUser() {
  localStorage.removeItem(CURRENT_USER_KEY);
}
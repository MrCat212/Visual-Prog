export type AuthUser = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
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

type UpdateUserNameData = {
  userId: string;
  name: string;
};

type ChangePasswordData = {
  userId: string;
  oldPassword: string;
  newPassword: string;
};

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

const USERS_KEY = 'spreadsheet_users';
const CURRENT_USER_KEY = 'spreadsheet_current_user';
const REFRESH_TOKEN_KEY = 'spreadsheet_refresh_token';

let accessToken: string | null = null;

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

function createToken(prefix: string, userId: string): string {
  return prefix + '-' + userId + '-' + Date.now() + '-' + Math.floor(Math.random() * 100000);
}

function createAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  };
}

function createSession(userId: string): AuthTokens {
  const tokens: AuthTokens = {
    accessToken: createToken('access', userId),
    refreshToken: createToken('refresh', userId),
  };

  accessToken = tokens.accessToken;
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);

  return tokens;
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

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function refreshAccessToken(): string {
  const currentUser = getCurrentUser();
  const refreshToken = getRefreshToken();

  if (currentUser === null || refreshToken === null) {
    throw new Error('Не удалось обновить Access Token');
  }

  accessToken = createToken('access', currentUser.id);

  return accessToken;
}

export function registerUser(data: RegisterData): AuthUser {
  const users = getUsers();

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === data.email) {
      throw new Error('Пользователь с таким email уже есть');
    }
  }

  const now = new Date().toISOString();

  const newUser: StoredUser = {
    id: createUserId(),
    name: data.name,
    email: data.email,
    password: data.password,
    createdAt: now,
  };

  users.push(newUser);
  saveUsers(users);

  const authUser = createAuthUser(newUser);

  saveCurrentUser(authUser);
  createSession(authUser.id);

  return authUser;
}

export function loginUser(data: LoginData): AuthUser {
  const users = getUsers();

  for (let i = 0; i < users.length; i++) {
    if (users[i].email === data.email && users[i].password === data.password) {
      const authUser = createAuthUser(users[i]);

      saveCurrentUser(authUser);
      createSession(authUser.id);

      return authUser;
    }
  }

  throw new Error('Неверный email или пароль');
}

export function updateUserName(data: UpdateUserNameData): AuthUser {
  const users = getUsers();
  const updatedUsers: StoredUser[] = [];

  let updatedUser: AuthUser | null = null;

  for (let i = 0; i < users.length; i++) {
    if (users[i].id === data.userId) {
      const newStoredUser: StoredUser = {
        ...users[i],
        name: data.name,
      };

      updatedUsers.push(newStoredUser);
      updatedUser = createAuthUser(newStoredUser);
    } else {
      updatedUsers.push(users[i]);
    }
  }

  if (updatedUser === null) {
    throw new Error('Пользователь не найден');
  }

  saveUsers(updatedUsers);
  saveCurrentUser(updatedUser);

  return updatedUser;
}

export function changePassword(data: ChangePasswordData) {
  const users = getUsers();
  const updatedUsers: StoredUser[] = [];

  let isChanged = false;

  for (let i = 0; i < users.length; i++) {
    if (users[i].id === data.userId) {
      if (users[i].password !== data.oldPassword) {
        throw new Error('Старый пароль введён неверно');
      }

      if (data.newPassword === users[i].password) {
        throw new Error('Новый пароль должен отличаться от старого');
      }

      updatedUsers.push({
        ...users[i],
        password: data.newPassword,
      });

      isChanged = true;
    } else {
      updatedUsers.push(users[i]);
    }
  }

  if (!isChanged) {
    throw new Error('Пользователь не найден');
  }

  saveUsers(updatedUsers);
}

export function logoutUser() {
  accessToken = null;
  localStorage.removeItem(CURRENT_USER_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

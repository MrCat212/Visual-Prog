import { beforeEach, describe, expect, it, vi } from 'vitest';

function createMockStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    get length() {
      return Object.keys(store).length;
    },

    clear() {
      store = {};
    },

    getItem(key: string) {
      return store[key] ?? null;
    },

    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },

    removeItem(key: string) {
      delete store[key];
    },

    setItem(key: string, value: string) {
      store[key] = value;
    },
  };
}

describe('authService', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createMockStorage());
  });

  it('должен регистрировать пользователя', async () => {
    const { getCurrentUser, registerUser } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(user.name).toBe('Андрей');
    expect(user.email).toBe('and2003@list.ru');
    expect(user.createdAt).not.toBe('');

    const currentUser = getCurrentUser();

    expect(currentUser).toEqual(user);
  });

  it('не должен регистрировать пользователя с повторным email', async () => {
    const { registerUser } = await import('@/services/authService');

    registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(() =>
      registerUser({
        name: 'Егор',
        email: 'and2003@list.ru',
        password: '87654321',
      }),
    ).toThrow('Пользователь с таким email уже есть');
  });

  it('должен входить по правильному email и паролю', async () => {
    const { loginUser, registerUser } = await import('@/services/authService');

    registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    const user = loginUser({
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(user.name).toBe('Андрей');
    expect(user.email).toBe('and2003@list.ru');
    expect(user.createdAt).not.toBe('');
  });

  it('не должен входить с неправильным паролем', async () => {
    const { loginUser, registerUser } = await import('@/services/authService');

    registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(() =>
      loginUser({
        email: 'and2003@list.ru',
        password: 'wrong-password',
      }),
    ).toThrow('Неверный email или пароль');
  });

  it('должен выходить из аккаунта', async () => {
    const { getCurrentUser, logoutUser, registerUser } = await import('@/services/authService');

    registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(getCurrentUser()).not.toBe(null);

    logoutUser();

    expect(getCurrentUser()).toBe(null);
  });

  it('должен изменять имя пользователя', async () => {
    const { getCurrentUser, registerUser, updateUserName } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    const updatedUser = updateUserName({
      userId: user.id,
      name: 'Егор',
    });

    expect(updatedUser.name).toBe('Егор');
    expect(updatedUser.email).toBe('and2003@list.ru');
    expect(updatedUser.createdAt).toBe(user.createdAt);

    const currentUser = getCurrentUser();

    expect(currentUser).toEqual(updatedUser);
  });

  it('должен менять пароль пользователя', async () => {
    const { changePassword, loginUser, registerUser } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    changePassword({
      userId: user.id,
      oldPassword: '12345678',
      newPassword: '87654321',
    });

    const loggedUser = loginUser({
      email: 'and2003@list.ru',
      password: '87654321',
    });

    expect(loggedUser.email).toBe('and2003@list.ru');
  });

  it('не должен менять пароль при неправильном старом пароле', async () => {
    const { changePassword, registerUser } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(() =>
      changePassword({
        userId: user.id,
        oldPassword: 'wrong-password',
        newPassword: '87654321',
      }),
    ).toThrow('Старый пароль введён неверно');
  });

  it('не должен менять пароль на текущий пароль', async () => {
    const { changePassword, registerUser } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(() =>
      changePassword({
        userId: user.id,
        oldPassword: '12345678',
        newPassword: '12345678',
      }),
    ).toThrow('Новый пароль должен отличаться от старого');
  });
});

describe('authSlice', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal('localStorage', createMockStorage());
  });

  it('должен иметь начальное состояние без пользователя', async () => {
    const { default: authReducer } = await import('@/features/auth/authSlice');

    const state = authReducer(undefined, {
      type: 'unknown',
    });

    expect(state.user).toBe(null);
    expect(state.isAuthorized).toBe(false);
  });

  it('должен записывать пользователя', async () => {
    const { default: authReducer, setUser } = await import('@/features/auth/authSlice');

    const user = {
      id: 'user-1',
      name: 'Андрей',
      email: 'and2003@list.ru',
      createdAt: '2026-01-01',
    };

    const state = authReducer(undefined, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.isAuthorized).toBe(true);
  });

  it('должен обновлять пользователя', async () => {
    const { default: authReducer, setUser, updateUser } = await import(
      '@/features/auth/authSlice'
    );

    const oldUser = {
      id: 'user-1',
      name: 'Андрей',
      email: 'and2003@list.ru',
      createdAt: '2026-01-01',
    };

    const newUser = {
      id: 'user-1',
      name: 'Егор',
      email: 'and2003@list.ru',
      createdAt: '2026-01-01',
    };

    const stateWithUser = authReducer(undefined, setUser(oldUser));
    const updatedState = authReducer(stateWithUser, updateUser(newUser));

    expect(updatedState.user).toEqual(newUser);
    expect(updatedState.isAuthorized).toBe(true);
  });

  it('должен выходить из аккаунта', async () => {
    const { default: authReducer, logout, setUser } = await import('@/features/auth/authSlice');

    const user = {
      id: 'user-1',
      name: 'Андрей',
      email: 'and2003@list.ru',
      createdAt: '2026-01-01',
    };

    const authorizedState = authReducer(undefined, setUser(user));
    const loggedOutState = authReducer(authorizedState, logout());

    expect(loggedOutState.user).toBe(null);
    expect(loggedOutState.isAuthorized).toBe(false);
  });

  it('должен брать сохранённого пользователя из localStorage', async () => {
    const savedUser = {
      id: 'user-1',
      name: 'Андрей',
      email: 'and2003@list.ru',
      createdAt: '2026-01-01',
    };

    localStorage.setItem('spreadsheet_current_user', JSON.stringify(savedUser));

    const { default: authReducer } = await import('@/features/auth/authSlice');

    const state = authReducer(undefined, {
      type: 'unknown',
    });

    expect(state.user).toEqual(savedUser);
    expect(state.isAuthorized).toBe(true);
  });

  it('должен записывать другого пользователя', async () => {
    const { default: authReducer, setUser } = await import('@/features/auth/authSlice');

    const user = {
      id: 'user-2',
      name: 'Егор',
      email: 'egorre@mail.ru',
      createdAt: '2026-01-01',
    };

    const state = authReducer(undefined, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.isAuthorized).toBe(true);
  });
});
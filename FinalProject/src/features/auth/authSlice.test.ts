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
    const { registerUser, getCurrentUser } = await import('@/services/authService');

    const user = registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(user.name).toBe('Андрей');
    expect(user.email).toBe('and2003@list.ru');

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
    const { registerUser, loginUser } = await import('@/services/authService');

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
  });

  it('не должен входить с неправильным паролем', async () => {
    const { registerUser, loginUser } = await import('@/services/authService');

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
    const { registerUser, getCurrentUser, logoutUser } = await import('@/services/authService');

    registerUser({
      name: 'Андрей',
      email: 'and2003@list.ru',
      password: '12345678',
    });

    expect(getCurrentUser()).not.toBe(null);

    logoutUser();

    expect(getCurrentUser()).toBe(null);
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
    };

    const state = authReducer(undefined, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.isAuthorized).toBe(true);
  });

  it('должен выходить из аккаунта', async () => {
    const { default: authReducer, logout, setUser } = await import('@/features/auth/authSlice');

    const user = {
      id: 'user-1',
      name: 'Андрей',
      email: 'and2003@list.ru',
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
    };

    const state = authReducer(undefined, setUser(user));

    expect(state.user).toEqual(user);
    expect(state.isAuthorized).toBe(true);
  });
});
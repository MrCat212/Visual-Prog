import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { registerUser } from '@/services/authService';

function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  function isEmailValid(value: string): boolean {
    return value.includes('@') && value.includes('.');
  }

  function handleRegister() {
    const preparedName = name.trim();
    const preparedEmail = email.trim();

    if (preparedName === '') {
      alert('Введите имя');
      return;
    }

    if (preparedEmail === '') {
      alert('Введите email');
      return;
    }

    if (!isEmailValid(preparedEmail)) {
      alert('Введите корректный email');
      return;
    }

    if (password.length < 8) {
      alert('Пароль должен быть не короче 8 символов');
      return;
    }

    if (password !== repeatPassword) {
      alert('Пароли не совпадают');
      return;
    }

    try {
      const user = registerUser({
        name: preparedName,
        email: preparedEmail,
        password,
      });

      dispatch(setUser(user));
      navigate('/dashboard', {
        replace: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Не удалось зарегистрироваться');
      }
    }
  }

  if (isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Регистрация</h1>

        <label>
          Имя
          <input
            value={name}
            placeholder="Введите имя"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <label>
          Email
          <input
            value={email}
            type="email"
            placeholder="Введите email"
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label>
          Пароль
          <input
            value={password}
            type="password"
            placeholder="Минимум 8 символов"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <label>
          Повтор пароля
          <input
            value={repeatPassword}
            type="password"
            placeholder="Повторите пароль"
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
        </label>

        <button type="button" onClick={handleRegister}>
          Зарегистрироваться
        </button>

        <p>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;

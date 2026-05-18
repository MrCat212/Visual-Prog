import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setUser } from '@/features/auth/authSlice';
import { loginUser } from '@/services/authService';

type LocationState = {
  from?: string;
};

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const isAuthorized = useAppSelector((state) => state.auth.isAuthorized);

  const locationState = location.state as LocationState | null;
  const returnPath = locationState?.from ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleLogin() {
    const preparedEmail = email.trim();

    if (preparedEmail === '') {
      alert('Введите email');
      return;
    }

    if (password === '') {
      alert('Введите пароль');
      return;
    }

    try {
      const user = loginUser({
        email: preparedEmail,
        password,
      });

      dispatch(setUser(user));
      navigate(returnPath, {
        replace: true,
      });
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Не удалось войти');
      }
    }
  }

  if (isAuthorized) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Вход</h1>

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
            placeholder="Введите пароль"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="button" onClick={handleLogin}>
          Войти
        </button>

        <p>
          Нет аккаунта? :c <Link to="/register">Зарегистрироваться</Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
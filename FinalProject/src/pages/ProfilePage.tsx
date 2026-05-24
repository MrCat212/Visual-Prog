import { useState } from 'react';

import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { updateUser } from '@/features/auth/authSlice';
import { getUserDocuments } from '@/services/documentService';
import { changePassword, updateUserName } from '@/services/authService';

function ProfilePage() {
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);

  const [name, setName] = useState(user?.name ?? '');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [repeatPassword, setRepeatPassword] = useState('');

  if (user === null) {
    return (
      <div className="profile-page">
        <h2>Пользователь не найден</h2>
      </div>
    );
  }

  const documents = getUserDocuments(user.id);

  let totalRows = 0;
  let totalCols = 0;

  for (let i = 0; i < documents.length; i++) {
    totalRows += documents[i].rows;
    totalCols += documents[i].cols;
  }

  function handleSaveName() {
    if (user === null) {
      return;
    }

    const preparedName = name.trim();

    if (preparedName === '') {
      alert('Введите имя');
      return;
    }

    try {
      const updatedUser = updateUserName({
        userId: user.id,
        name: preparedName,
      });

      dispatch(updateUser(updatedUser));
      alert('Имя обновлено');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Не удалось обновить имя');
      }
    }
  }

  function handleChangePassword() {
    if (user === null) {
      return;
    }

    if (oldPassword === '') {
      alert('Введите старый пароль');
      return;
    }

    if (newPassword.length < 8) {
      alert('Новый пароль должен быть не короче 8 символов');
      return;
    }

    if (newPassword !== repeatPassword) {
      alert('Новые пароли не совпадают');
      return;
    }

    try {
      changePassword({
        userId: user.id,
        oldPassword,
        newPassword,
      });

      setOldPassword('');
      setNewPassword('');
      setRepeatPassword('');

      alert('Пароль изменён');
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert('Не удалось изменить пароль');
      }
    }
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <h2>Профиль</h2>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>ID:</strong> {user.id}
        </p>
      </div>

      <div className="profile-card">
        <h2>Изменение имени</h2>

        <label>
          Имя
          <input
            value={name}
            placeholder="Введите имя"
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <button type="button" onClick={handleSaveName}>
          Сохранить имя
        </button>
      </div>

      <div className="profile-card">
        <h2>Смена пароля</h2>

        <label>
          Старый пароль
          <input
            value={oldPassword}
            type="password"
            placeholder="Введите старый пароль"
            onChange={(event) => setOldPassword(event.target.value)}
          />
        </label>

        <label>
          Новый пароль
          <input
            value={newPassword}
            type="password"
            placeholder="Минимум 8 символов"
            onChange={(event) => setNewPassword(event.target.value)}
          />
        </label>

        <label>
          Повтор нового пароля
          <input
            value={repeatPassword}
            type="password"
            placeholder="Повторите новый пароль"
            onChange={(event) => setRepeatPassword(event.target.value)}
          />
        </label>

        <button type="button" onClick={handleChangePassword}>
          Изменить пароль
        </button>
      </div>

      <div className="profile-card">
        <h2>Статистика</h2>

        <p>
          <strong>Документов:</strong> {documents.length}
        </p>

        <p>
          <strong>Всего строк:</strong> {totalRows}
        </p>

        <p>
          <strong>Всего столбцов:</strong> {totalCols}
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;
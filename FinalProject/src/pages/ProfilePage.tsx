import { useAppSelector } from '@/app/hooks';

function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);

  if (user === null) {
    return (
      <div className="profile-page">
        <h2>Пользователь не найден</h2>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <h2>Профиль</h2>

      <div className="profile-card">
        <p>
          <strong>Имя:</strong> {user.name}
        </p>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>ID:</strong> {user.id}
        </p>
      </div>
    </div>
  );
}

export default ProfilePage;
import { Link } from 'react-router-dom';

function NotFoundPage() {
  return (
    <div className="not-found-page">
      <h2>Такой страницы попросту нет</h2>
      <p>Перепроверьте правильность адреса. Грустно, но это не ваша вина ^._.^</p>

      <Link to="/dashboard">Вернуться к документам</Link>
    </div>
  );
}

export default NotFoundPage;
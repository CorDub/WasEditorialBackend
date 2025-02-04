import { Link, useNavigate } from 'react-router-dom';
import UserContext from './UserContext';
import { useEffect, useContext } from 'react';

function AdminPage () {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user !== undefined && (user === null || user.is_admin === false)) {
      navigate("/");
    }
  }, [user]);

  return (
    <>
      <Link to='/admin/authors' className="blue-button">Lista de autores</Link>
      <Link to='/libros' className="blue-button">Lista de libros</Link>
      <Link to='/librerias' className="blue-button">Lista de librerias</Link>
      <Link to='/categorias' className="blue-button">Lista de categorias</Link>
    </>
  )
}

export default AdminPage;

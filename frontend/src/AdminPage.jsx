import { Link } from 'react-router-dom';
import useCheckUser from './customHooks/useCheckUser';

function AdminPage () {
  useCheckUser();

  return (
    <>
      <Link to='/admin/authors' className="blue-button">Lista de autores</Link>
      <Link to='/admin/books' className="blue-button">Lista de libros</Link>
      <Link to='/admin/bookstores' className="blue-button">Lista de librerias</Link>
      <Link to='/admin/categories' className="blue-button">Lista de categorias</Link>
    </>
  )
}

export default AdminPage;

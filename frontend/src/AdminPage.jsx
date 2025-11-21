import { Link } from 'react-router-dom';
import useCheckUser from './customHooks/useCheckUser';

function AdminPage () {
  useCheckUser();

  return (
    <>
      <Link to='/api/admin/authors' className="blue-button">Lista de autores</Link>
      <Link to='/api/admin/books' className="blue-button">Lista de libros</Link>
      <Link to='/api/admin/bookstores' className="blue-button">Lista de librerias</Link>
      <Link to='/api/admin/categories' className="blue-button">Lista de categorias</Link>
    </>
  )
}

export default AdminPage;

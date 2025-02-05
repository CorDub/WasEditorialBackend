import { Link } from 'react-router-dom';
import useCheckUser from './useCheckUser';

function AdminPage () {
  useCheckUser();

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

import { Link } from 'react-router-dom';

function AdminPage () {
  return (
    <>
      <Link to='/authors' className="blue-button">Lista de autores</Link>
    </>
  )
}

export default AdminPage;

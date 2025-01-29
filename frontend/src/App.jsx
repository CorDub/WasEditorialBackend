import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './AdminPage.jsx';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorPage from './AuthorPage.jsx';
import AuthorsList from './AuthorsList.jsx';
import NewAuthorPage from './NewAuthorPage.jsx';
import EditAuthorPage from './EditAuthorPage.jsx';
import DeleteAuthorPage from './DeleteAuthorPage.jsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path='/admin' element={<AdminPage />} />
        <Route path='/author' element={<AuthorPage />} />
        <Route path='/authors' element={<AuthorsList />} />
        <Route path='/new-author' element={<NewAuthorPage />} />
        <Route path='/edit-author' element={<EditAuthorPage />} />
        <Route path='/delete-author' element={<DeleteAuthorPage />} />
      </Routes>
    </Router>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './AdminPage.jsx';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorPage from './AuthorPage.jsx';
import AuthorsList from './AuthorsList.jsx';
import NewAuthorPage from './AddingAuthorModal.jsx';
import EditAuthorPage from './EditAuthorModal.jsx';
import DeleteAuthorPage from './DeleteAuthorModal.jsx';
import ConfirmationCodePage from './ConfirmationCodePage.jsx';
import ChangePasswordPage from './ChangePasswordPage.jsx';
import ForgottenPasswordPage from './ForgottenPasswordPage.jsx';
import UserProvider from './UserProvider.jsx';
import Navbar from './Navbar.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/author' element={<AuthorPage />} />
          <Route path="/author/:id" element={<AuthorPage />} />
          <Route path='/admin/authors' element={<AuthorsList />} />
          <Route path='/admin/new-author' element={<NewAuthorPage />} />
          {/* <Route path='/admin/edit-author' element={<EditAuthorPage />} />
          <Route path='/admin/delete-author' element={<DeleteAuthorPage />} /> */}
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/author/change-password' element={<ChangePasswordPage />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

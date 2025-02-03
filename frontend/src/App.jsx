import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminPage from './AdminPage.jsx';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorPage from './AuthorPage.jsx';
import AuthorsList from './AuthorsList.jsx';
import NewAuthorPage from './NewAuthorPage.jsx';
import EditAuthorPage from './EditAuthorPage.jsx';
import DeleteAuthorPage from './DeleteAuthorPage.jsx';
import ConfirmationCodePage from './ConfirmationCodePage.jsx';
import ChangePasswordPage from './ChangePasswordPage.jsx';
import ForgottenPasswordPage from './ForgottenPasswordPage.jsx';
import UserProvider from './UserProvider.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/author' element={<AuthorPage />} />
          <Route path="/author/:id" element={<AuthorPage />} />
          <Route path='/authors' element={<AuthorsList />} />
          <Route path='/new-author' element={<NewAuthorPage />} />
          <Route path='/edit-author' element={<EditAuthorPage />} />
          <Route path='/delete-author' element={<DeleteAuthorPage />} />
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/change-password' element={<ChangePasswordPage />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

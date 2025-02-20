import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// import AdminPage from './AdminPage.jsx';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorPage from './AuthorPage.jsx';
import AuthorsList from './AuthorsList.jsx';
import ConfirmationCodePage from './ConfirmationCodePage.jsx';
import ChangePasswordPage from './ChangePasswordPage.jsx';
import ForgottenPasswordPage from './ForgottenPasswordPage.jsx';
import UserProvider from './UserProvider.jsx';
import CategoriesList from './CategoriesList.jsx';
import BooksList from "./BooksList.jsx";
import BookstoresList from './BookstoresList.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          {/* <Route path='/admin' element={<AdminPage />} /> */}
          <Route path='/author' element={<AuthorPage />} />
          <Route path="/author/:id" element={<AuthorPage />} />
          <Route path='/admin/authors' element={<AuthorsList />} />
          <Route path="/admin/categories" element={<CategoriesList />} />
          <Route path="/admin/books" element={<BooksList />} />
          <Route path="/admin/bookstores" element={<BookstoresList />} />
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/author/change-password' element={<ChangePasswordPage />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

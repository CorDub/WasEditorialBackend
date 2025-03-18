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
import AdminsList from "./AdminsList.jsx";
import InventoriesList from './InventoriesList.jsx';
import SalesList from "./SalesList.jsx"
import InventoriesAreaDashboard from './InventoriesAreaDashboard.jsx';
import AuthorInventory from './AuthorInventory.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path="/superadmin/admins" element={<AdminsList />} />
          {/* <Route path='/admin' element={<AdminPage />} /> */}
          {/* <Route path='/author' element={<AuthorPage />} /> */}
          <Route path='/admin/authors' element={<AuthorsList />} />
          <Route path="/admin/categories" element={<CategoriesList />} />
          <Route path="/admin/inventories" element={<InventoriesList />} />
          <Route path="/admin/inventories2" element={<InventoriesAreaDashboard />} />
          <Route path="/admin/sales" element={<SalesList />} />
          <Route path="/admin/books" element={<BooksList />} />
          <Route path="/admin/bookstores" element={<BookstoresList />} />
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/author/change-password' element={<ChangePasswordPage />} />
          <Route path='/author/inventory' element={<AuthorInventory/>} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorsList from './AuthorsList.jsx';
import ConfirmationCodePage from './ConfirmationCodePage.jsx';
import ChangePasswordPage from './ChangePasswordPage.jsx';
import ForgottenPasswordPage from './ForgottenPasswordPage.jsx';
import UserProvider from './UserProvider.jsx';
import CategoriesList from './CategoriesList.jsx';
import BooksList from "./BooksList.jsx";
import BookstoresList from './BookstoresList.jsx';
import AdminsList from "./AdminsList.jsx";
// import InventoriesList from './InventoriesList.jsx';
import SalesList from "./SalesList.jsx"
import InventoriesAreaDashboard from './InventoriesAreaDashboard.jsx';
import AuthorInventory from './AuthorInventory.jsx';
import InventoriesProvider from './InventoriesProvider.jsx';
import BookstoreInventory from './BookstoreInventory.jsx';
import BookInventory from './BookInventory.jsx';
import AuthorSales from './AuthorSales.jsx';
import AuthorCommissions from './AuthorComissions.jsx';
import ProfilePage from './ProfilePage.jsx';

function App() {
  return (
    <UserProvider>
    <InventoriesProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path="/superadmin/admins" element={<AdminsList />} />
          <Route path='/admin/authors' element={<AuthorsList />} />
          <Route path="/admin/categories" element={<CategoriesList />} />
          {/* <Route path="/admin/inventories" element={<InventoriesList />} /> */}
          <Route path="/admin/inventories2" element={<InventoriesAreaDashboard />} />
          <Route path="/admin/bookstoreInventory" element={<BookstoreInventory />} />
          <Route path="/admin/bookInventory" element={<BookInventory />} />
          <Route path="/admin/sales" element={<SalesList />} />
          <Route path="/admin/books" element={<BooksList />} />
          <Route path="/admin/bookstores" element={<BookstoresList />} />
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/profile-page' element={<ProfilePage/>} />
          <Route path='/author/change-password' element={<ChangePasswordPage />} />
          <Route path='/author/inventory' element={<AuthorInventory/>} />
          <Route path='/author/sales' element={<AuthorSales/>} />
          <Route path='/author/commissions' element={<AuthorCommissions />} />
        </Routes>
      </Router>
    </InventoriesProvider>
    </UserProvider>
  )
}

export default App

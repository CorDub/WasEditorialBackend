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
// import SalesList from "./SalesList.jsx"
import InventoriesAreaDashboard from './InventoriesAreaDashboard.jsx';
import AuthorInventory from './AuthorInventory.jsx';
// import InventoriesProvider from './InventoriesProvider.jsx';
import BookstoreInventory from './BookstoreInventory.jsx';
import BookInventory from './BookInventory.jsx';
import AuthorSales from './AuthorSales.jsx';
import AuthorCommissions from './AuthorComissions.jsx';
import ProfilePage from './ProfilePage.jsx';
import PaymentsList from './PaymentsList.jsx';
import CostsList from "./CostsList.jsx";
import InventoriesList from "./InventoriesList.jsx";
import SalesListPerMonths from './SalesListPerMonths.jsx';
import KindleSalesListPerMonth from './KindleSalesListPerMonth.jsx';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage/>} />
          <Route path="/api/superadmin/admins" element={<AdminsList />} />
          <Route path='/api/admin/authors' element={<AuthorsList />} />
          <Route path="/api/admin/categories" element={<CategoriesList />} />
          <Route path="/api/admin/inventories" element={<InventoriesAreaDashboard />} />
          <Route path="/api/admin/bookstoreInventory" element={<BookstoreInventory />} />
          <Route path="/api/admin/bookInventory" element={<BookInventory />} />
          <Route path="/api/admin/sales" element={<SalesListPerMonths />} />
          <Route path='/api/admin/kindle' element={<KindleSalesListPerMonth />} />
          <Route path="/api/admin/books" element={<BooksList />} />
          <Route path="/api/admin/bookstores" element={<BookstoresList />} />
          <Route path='/api/admin/payments' element={<PaymentsList />} />
          <Route path='/api/admin/costs' element={<CostsList />} />
          {/* <Route path='/api/admin/sales2' element={<SalesListPerMonths />} /> */}
          <Route path='/api/admin/inventories-list' element={<InventoriesList/>} />
          <Route path='/forgotten-password' element={<ForgottenPasswordPage />} />
          <Route path='/confirmation-code' element={<ConfirmationCodePage />} />
          <Route path='/profile-page' element={<ProfilePage/>} />
          <Route path='/api/author/change-password' element={<ChangePasswordPage />} />
          <Route path='/api/author/inventory' element={<AuthorInventory/>} />
          <Route path='/api/author/sales' element={<AuthorSales/>} />
          <Route path='/api/author/commissions' element={<AuthorCommissions />} />
        </Routes>
      </Router>
    </UserProvider>
  )
}

export default App

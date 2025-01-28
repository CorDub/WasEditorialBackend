import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Example from './Example.jsx';
import LoginPage from './Login.jsx';
import './Global.scss';
import AuthorPage from './AuthorPage.jsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path='/example' element={<Example />} />
        <Route path='/author' element={<AuthorPage />} />
      </Routes>
    </Router>
  )
}

export default App

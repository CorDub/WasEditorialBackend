import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Example from './Example.jsx';
import LoginPage from './Login.jsx';

function App() {

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage/>} />
        <Route path='/example' element={<Example />} />
      </Routes>
    </Router>
  )
}

export default App

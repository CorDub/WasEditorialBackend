import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.scss';
import logo from './assets/logo-03-300x110-was.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  async function handleSubmit (e) {
    e.preventDefault();

    try {
      const response = await fetch('/api/login', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
      }

      const data = await response.json();
      if (data.is_admin === true) {
        navigate('/admin');
      } else {
        navigate('/author');
      }

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <div className="login-page">
      <div className="login-logo">
        <img src={logo} alt="was-editorial-log" />
      </div>
      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <input className="login-input" type="text" placeholder="Correo"
            onChange={(e) => setEmail(e.target.value)}/>
          <input className="login-input" type="password" placeholder="Contraseña"
            onChange={(e) => setPassword(e.target.value)}/>
          <button className="blue-button" type="submit">Enter</button>
        </form>
      </div>
      <Link to="/forgotten-password"
        className="login-forgotten-password">Olvidaste su contraseña?</Link>
    </div>
  )
}

export default LoginPage;

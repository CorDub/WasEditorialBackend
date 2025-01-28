import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

      if (!response.ok) {
        console.log(response.status);
      }

      const data = await response.json();
      if (data.is_admin === false) {
        navigate('/author');
      } else {
        navigate('/example');
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
          <label className="login-label" htmlFor='email'>Correo</label>
          <input className="login-input" type="text" id="email"
            onChange={(e) => setEmail(e.target.value)}/>
          <label className="login-label" htmlFor='password'>Contraseña</label>
          <input className="login-input" type="password" id="password"
            onChange={(e) => setPassword(e.target.value)}/>

          <button className="blue-button" type="submit">Enter</button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage;

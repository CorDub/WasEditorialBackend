import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Login.scss';
import logo from './assets/logo-03-300x110-was.png';
import UserContext from './UserContext';
import LoginError from './LoginError';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const inputs = document.querySelectorAll("input");

  async function handleSubmit (e) {
    e.preventDefault();

    try {
      inputs.forEach((input) => {
        input.classList.remove("error")
      })
      const newErrors = checkBoundsErrors(email, password);
      if (newErrors.length !== 0) {
        return;
      }

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
        setErrors([...errors, 1]);
      } else {
        const data = await response.json();
        setUser(data);
        if (data.is_admin === true) {
          navigate('/admin/authors');
        } else {
          navigate('/author');
        }
      }

    } catch(error) {
      console.error(error);
    }
  }

  function checkBoundsErrors(email, password) {
    let newErrors = [];

    if (typeof email !== "string" || typeof password !== "string") {
      newErrors.push(1);
    } else {
      if (email.length === 0) {newErrors.push(2)};
      if (email.length > 50 || password.length > 50) {newErrors.push(1)};
      if (password.length === 0) {newErrors.push(3)};
    }

    setErrors(newErrors);
    return newErrors;
  }

  return (
    <div className="login-page">
      <div className="login-logo">
        <img src={logo} alt="was-editorial-log" />
      </div>
      <div className="login-form">
        <form onSubmit={handleSubmit}>
          <input className="global-input login-input" type="text" placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}/>
          <input className="global-input login-input" type="password" placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}/>
          <div className="login-button">
            <button className="blue-button" type="submit">Enter</button>
          </div>
        </form>
      </div>
      <LoginError errors={errors} setErrors={setErrors} inputs={inputs} />
      <div className="login-forpas">
      <Link to="/forgotten-password"
        className="login-forgotten-password">Olvidó su contraseña?</Link>
      </div>
    </div>
  )
}

export default LoginPage;

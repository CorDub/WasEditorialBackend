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
      await checkBoundsErrors(email, password);
      if (errors.length !== 0) {
        // setErrors([]);
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
        transformErrorInputs();
      } else {
        const data = await response.json();
        setUser(data);
        if (data.is_admin === true) {
          navigate('/admin');
        } else {
          navigate('/author');
        }
      }

    } catch(error) {
      console.error(error);
    }
  }

  async function checkBoundsErrors(email, password) {
    let newErrors = [];

    if (typeof email !== "string" || typeof password !== "string") {
      newErrors.push(1);
      return;
    }

    if (email.length === 0) {
      newErrors.push(2);
      return;
    }

    if (email.length > 30) {
      newErrors.push(1);
      return;
    }

    if (password.length === 0) {
      newErrors.push(3);
      return;
    }

    if (password.length > 30) {
      newErrors.push(1);
      return;
    }

    setErrors(newErrors);
  }

  function transformErrorInputs() {
    inputs.forEach((input) => {
      input.classList.add("error");
      input.value = "";
      input.value = "";
    })
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
          <div className="login-button">
            <button className="blue-button" type="submit">Enter</button>
          </div>
        </form>
      </div>
      <LoginError errors={errors} />
      <Link to="/forgotten-password"
        className="login-forgotten-password">Olvidó su contraseña?</Link>
    </div>
  )
}

export default LoginPage;

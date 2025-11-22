import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Login.scss';
import logo from './assets/PlataformaWas.png';
import UserContext from './UserContext';
import LoginError from './LoginError';
import Alert from './Alert';
import checkForErrors from "./customHooks/checkForErrors";
import LoadingWheel from "./LoadingWheel";

function LoginPage() {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const inputs = document.querySelectorAll("input");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const location = useLocation();
  const emailRef = useRef();
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state) {
      setAlertMessage(location.state.alertMessage);
      setAlertType(location.state.type);
    };
  }, [location]);

  async function handleSubmit (e) {
    e.preventDefault();

    try {
      inputs.forEach((input) => {
        input.classList.remove("error-inputs")
      })
      const newErrors = checkBoundsErrors(email, password);
      if (newErrors.length !== 0) {
        return;
      }

      setLoading(true);
      const response = await fetch(`${baseURL}/api/user/login`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          email: email,
          password: password,
        }),
      });

      if (response.ok === false) {
        setErrors([...errors, 1]);
        setLoading(false);
      } else {
        const data = await response.json();

        setUser(data);
        setLoading(false);
        if (data.role === "admin") {
          navigate('/api/admin/authors')
        } else if (data.role === "superadmin") {
          navigate('/api/superadmin/admins')
        } else {
          navigate(`/api/author/sales`);
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

    const expectationsEmail = {
      validity: "email valid"
    }

    const errorsLine = checkForErrors("El correo que ingresabá", email, expectationsEmail, emailRef);
    if (errorsLine.length > 0) {
      newErrors.push(4);
    }

    setErrors(newErrors);
    return newErrors;
  }

  return (
    <div className="login-page">
      <div className="login-logo">
        <img src={logo} alt="was-editorial-log" />
      </div>
      <div className="login-form ">
        <form onSubmit={handleSubmit} className="global-form special-login">
          <input className="global-input login-input"
            type="text"
            placeholder="Correo"
            value={email}
            ref={emailRef}
            onChange={(e) => setEmail(e.target.value)}/>
          <input className="global-input login-input"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}/>
          <div className="login-button">
            <button className="blue-button" type="submit">Entrar</button>
          </div>
        </form>
      </div>
      <LoginError errors={errors} setErrors={setErrors} inputs={inputs} />
      {isLoading && (
        <LoadingWheel />)}
      <div className="login-forpas">
        <Link to="/forgotten-password"
          className="login-forgotten-password">¿Olvidó su contraseña?
        </Link>
      </div>
      <Alert message={alertMessage} type={alertType} setAlertMessage={setAlertMessage}
        setAlertType={setAlertType}/>
    </div>
  )
}

export default LoginPage;

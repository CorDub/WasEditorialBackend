import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

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
      console.log(data);
      navigate('/example');
      
    } catch(error) {
      console.error(error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label htmlFor='email'>Email</label>
        <input type="text" id="email"
          placeholder="Email address"
          onChange={(e) => setEmail(e.target.value)}/>
        <label htmlFor='password'>Password</label>
        <input type="password" id="password"
          onChange={(e) => setPassword(e.target.value)}/>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default LoginPage;

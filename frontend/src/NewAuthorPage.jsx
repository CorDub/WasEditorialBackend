import { useState } from 'react';

function NewAuthorPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  async function handleSubmit() {
    try {
      const response = await fetch('/api/user', {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name,
          email: email,
        }),
      });

      if (response.ok === false) {
        console.log(response.status);
      }

      const data = await response.json();
      alert(`Un nuevo author ${data.name} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`);

    } catch(error) {
      console.error(error);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input type='text' onChange={(e) => setName(e.target.value)}></input>
        <label>Email</label>
        <input type='text' onChange={(e) => setEmail(e.target.value)}></input>
        <button type='submit'>Añadir nuevo autor</button>
      </form>
    </>
  )
}

export default NewAuthorPage;

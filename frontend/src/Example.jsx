import { useState, useEffect } from 'react';

function Example () {
  const [message, setMessage] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(()=>{
    fetch('/api/message')
      .then((response) => response.json())
      .then((data) => setMessage(data.message))
  }, []);

  async function fetchUsers() {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      console.log(data);
      setUsers(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  console.log(users);

  return (
    <>
      <div>
        <p>Message from backend: {message}</p>
      </div>
      <div>
        <p>Message from the database:</p>
        <ul>
          {users && users.map((user) => {
            return <li key={user.id}>{user.name} -  {user.email}</li>
          })}
        </ul>
      </div>
    </>
  )
}

export default Example;

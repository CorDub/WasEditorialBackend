import { useState } from "react";
import UserContext from "./UserContext";

function UserProvider({ children }) {
  const [user, setUser] = useState("");
  const baseURL = import.meta.env.VITE_API_URL || '';

  async function fetchUser() {
    try {
      const response = await fetch(`${baseURL}/checkPermissions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok === true) {
        setUser(data);
        return(data);
      } else {
        setUser(prev => {
          return null;
        });
        console.log('no user to fetch');
        return(user);
      }

    } catch(error) {
      console.error("Error fetching User in userContext:", error);
    }
  }

  return (
    <UserContext.Provider value={{ user, setUser, fetchUser }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;

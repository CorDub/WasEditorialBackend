import { useState } from "react";
import UserContext from "./UserContext";

function UserProvider({ children }) {
  const [user, setUser] = useState("");

  async function fetchUser() {
    try {
      const response = await fetch(`http://localhost:3000/api/checkPermissions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      const data = await response.json();

      if (response.ok === true) {
        setUser(data);
      } else {
        setUser(null);
        console.log('no user to fetch');
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

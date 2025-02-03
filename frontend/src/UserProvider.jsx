import { useState } from "react";
import UserContext from "./UserContext";

function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  async function fetchUser() {
    try {
      const response = await fetch(`/api/checkPermissions`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
      });

      const data = await response.json();
      console.log("Data from userContext:", data);

      if (response.ok === true) {
        setUser(data);
      } else {
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

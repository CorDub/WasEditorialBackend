import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckUser(page_id) {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      if (user !== "") {
        if (user === null) {
          navigate("/");
          return;
        }

      if (user.role === "superadmin" || user.role === "admin") {
        return;
      }

      // if (user.id !== page_id) {
      //   navigate("/");
      //   return;
      // }

        return;
      }

      const userData = await fetchUser();

      if (userData === null) {
        navigate("/");
        return;
      };

      if (userData.role === "superadmin" || userData.role === "admin") {
        return;
      }

      // if (userData.id !== page_id) {
      //   navigate("/");
      //   return;
      // }
    }

    fetchUserData();

  }, [user])
}

export default useCheckUser;

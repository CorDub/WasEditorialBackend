import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckUser() {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      if (user !== "") {
        if (user === null) {
          navigate("/");
          return;
        }

        if (user.role !== "superadmin" || user.role !== "admin") {
          navigate("/");
          return;
        }
      }

      const userData = await fetchUser();

      if (userData === null) {
        navigate("/");
        return;
      };

      if (userData.role !== "superadmin" || user.role !== "admin") {
        navigate("/");
      }
    }

    fetchUserData();

  }, [])
}

export default useCheckUser;

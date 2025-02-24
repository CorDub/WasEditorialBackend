import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckSuperAdmin() {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      const userData = await fetchUser();

      if (userData === null) {
        navigate("/");
        return;
      };

      if (userData.role !== "superadmin") {
        navigate("/");
      }
    }

    fetchUserData();

  }, [])
}

export default useCheckSuperAdmin;

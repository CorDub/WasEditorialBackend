import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckSuperAdmin() {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUserData() {
      await fetchUser();
    }
    fetchUserData();
  }, [])

  useEffect(() => {
    if (user === null) {
      navigate("/");
      return;
    }

    if (user.role !== "superadmin") {
      navigate("/");
    }
  }, []);
}

export default useCheckSuperAdmin;

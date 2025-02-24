import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckSuperAdmin() {
  const { user, fetchUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
  }, [])

  useEffect(() => {
    if (user === "") {
      return;
    }

    if (user === null) {
      navigate("/");
      return;
    }

    if (user.role !== "superadmin") {
      navigate("/");
    }
  }, [user, navigate]);
}

export default useCheckSuperAdmin;

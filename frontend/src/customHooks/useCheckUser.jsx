import { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import UserContext from '../UserContext';

function useCheckUser() {
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
      navigate("/"); // Navigate only if user is still null after the update
    }
  }, [user, navigate]);
}

export default useCheckUser;

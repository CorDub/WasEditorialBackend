import { useParams } from "react-router-dom";
import useCheckUser from "./customHooks/useCheckUser"
import { useContext } from "react";
import UserContext from "./UserContext";

function AuthorPage() {
  const { user } = useContext(UserContext);
  const params = useParams();
  const page_id = parseInt(params.id);
  console.log(page_id);

  useCheckUser(page_id);

  return (
    <>
      <h1>Yeah this is the author page number {page_id && page_id}</h1>
    </>
  )
};

export default AuthorPage;

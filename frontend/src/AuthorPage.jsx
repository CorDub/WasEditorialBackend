import useCheckUser from "./useCheckUser";

function AuthorPage() {
  useCheckUser();

  return (
    <>
      <h1>Yeah this is the author page</h1>
    </>
  )
};

export default AuthorPage;

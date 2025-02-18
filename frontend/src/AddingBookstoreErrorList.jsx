import { useEffect } from "react";

function AddingBookstoreErrorList({ errorList, setErrorList }) {
  useEffect(() => {
    setErrorList([]);
  }, [])

  function displayError(error) {
    switch (error) {
      case 11:
        return (<p className="login-error">El nombre de la librería no puede estar vacío.</p>)
      default:
        console.log('Unknown error')
        return;
    }
  }

  useEffect(() => {
    setErrorList([]);
  }, []);

  return(
    <div className="login-errors">
      {errorList.map((error, index) => (
        <div key={index} className="login-error">
          {displayError(error)}
        </div>
      ))}
  </div>
  )
}

export default AddingBookstoreErrorList;

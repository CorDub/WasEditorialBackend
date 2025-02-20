import { useEffect } from "react";

function ChangePasswordPageErrors({ errorList, setErrorList }) {
  useEffect(()=> {
    setErrorList([]);
  }, [])

  function displayError(error) {
    switch (error) {
      case 1:
        return (<p className="login-error">La contraseña no puede estar vacía.</p>)
      case 11:
        return (<p className="login-error">La contraseña debe estar la misma en ambos campos.</p>)
      case 12:
        return (<p className="login-error">La contraseña debe tener un minimo de 8 caracters.</p>)
      case 13:
        return (<p className="login-error">La contraseña debe tener un minimo de 1 letra majuscula, 1 letra minima, 1 numero y 1 caracter especial (!@#$%^&*(),.?":{}|<></>).</p>)
      case 14:
        return (<p className="login-error">La contraseña no puede estar la misma que la precedente.</p>)
      default:
        console.log('Unknown error')
        return;
    }
  }

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

export default ChangePasswordPageErrors;

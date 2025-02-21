import { useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";

function AddingAuthorModalErrors({ errors, setErrors }) {
  useCheckUser();

  function displayError(error) {
    switch (error) {
      case 11:
        return (<p className="login-error">El nombre no puede estar vacío.</p>)
      case 12:
        return (<p className="login-error">El nombre no puede tener más de 50 caracteres.</p>)
      case 22:
        return (<p className="login-error">El apellido no puede tener más de 50 caracteres.</p>)
      case 121:
        return (<p className="login-error">Un autor con este mismo nombre completo ya existe.</p>)
      case 31:
        return (<p className="login-error">El país no puede estar vacío.</p>)
      case 32:
        return (<p className="login-error">Por favor elige un país en la lista.</p>)
      case 41:
        return (<p className="login-error">El referido no puede tener más de 100 caracteres.</p>)
      case 51:
        return (<p className="login-error">El correo no puede estar vacío.</p>)
      case 52:
        return (<p className="login-error">El correo no puede tener más de 50 caracteres.</p>)
      case 53:
        return (<p className="login-error">Este correo ya está usado.</p>)
      case 61:
        return (<p className="login-error">La categoría no puede estar vacía.</p>)
      case 62:
        return (<p className="login-error">Por favor elige una categoría en la lista.</p>)
      default:
        console.log("Unkown error")
        return;
    }
  }

  useEffect(() => {
    setErrors([]);
  }, []);

  return (
    <div className="login-errors">
      {errors.length === 0 ?
        null :
        errors.map((error, index) => (
          <div key={index} className="login-error">
            {displayError(error)}
          </div>
        ))
      }
    </div>
  )
}

export default AddingAuthorModalErrors;

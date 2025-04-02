import { useEffect } from "react";

function AddingBookErrorList({ errorList, setErrorList }) {
  function displayError(error) {
    switch (error) {
      case 11:
        return (<p className="login-error">El titulo no puede estar vacío.</p>)
      case 12:
        return (<p className="login-error">El titulo no puede tener mas de 200 caracteres.</p>)
      case 21:
        return (<p className="login-error">La pasta no puede estar vacía.</p>)
      case 22:
        return (<p className="login-error">Por favor elige una pasta en la lista.</p>)
      case 31:
        return (<p className="login-error">El precio debe estar un numero.</p>)
      case 32:
        return (<p className="login-error">El precio debe estar superior a cero.</p>)
      case 33:
        return (<p className="login-error">El precio no puede estar vacío.</p>)
      case 41:
        return (<p className="login-error">El ISBN debe ser un numero</p>)
      case 42:
        return (<p className="login-error">Este ISBN ya existe</p>)
      case 51:
        return (<p className="login-error">El autor no puede estar vacío.</p>)
      case 52:
        return (<p className="login-error">Por favor elige un autor en la lista.</p>)
      case 53:
        return (<p className="login-error">No se puede tener dos veces lo mismo autor.</p>)
      case 61:
        return (<p className="login-error">La cantidad debe ser un numero.</p>)
      case 62:
        return (<p className="login-error">La cantidad debe estar superior a cero.</p>)
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

export default AddingBookErrorList;

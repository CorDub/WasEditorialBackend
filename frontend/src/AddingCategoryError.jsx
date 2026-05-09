import { useEffect } from 'react';

function AddingCategoryError({errorList, setErrorList}) {
  useEffect(() => {
    setErrorList([]);
  }, [])

  function displayError(error) {
    switch (error) {
      case 1: 
        return (<p className="login-error">El número no puede estar vacío</p>)
      case 2: 
        return (<p className="login-error">No es un número</p>)
      case 11:
        return (<p className="login-error">El tipo no puede estar vacío.</p>)
      // case 12:
      //   return (<p className="login-error">El tipo no puede tener mas de 30 caracteres.</p>)
      // case 13:
      //   return (<p className="login-error">Este tipo ya existe.</p>)
      case 21:
        return (<p className="login-error">El percentage de regalias debe estar un número.</p>)
      case 22:
        return (<p className="login-error">El percentage de regalias no puede estar vacío.</p>)
      case 23:
        return (<p className="login-error">El percentage de regalias no puede ser mas de 100.</p>)
      case 31:
        return (<p className="login-error">El percentage de gestion de tiendas debe estar un número.</p>)
      case 32:
        return (<p className="login-error">El percentage de gestion de tiendas no puede estar vacío.</p>)
      case 33:
        return (<p className="login-error">El percentage de gestion de tiendas no puede ser mas de 100.</p>)
      case 41:
        return (<p className="login-error">El minima de gestion debe estar un número.</p>)
      case 42:
        return (<p className="login-error">El minima de gestion no puede estar vacío.</p>)
      case 51:
        return (<p className="login-error">El descuento no puede estar vacío.</p>)
      case 52:
        return (<p className="login-error">El descuento debe estar un número.</p>)
      case 53:
        return (<p className="login-error">El descuento debe estar entre 0 y 100.</p>)
      default:
        console.error('Unknown error')
        return;
    }
  }

  return(
    <div className="general-error">
      {errorList.map((error, index) => (
        <div key={index} className="login-error">
          {displayError(error)}
        </div>
      ))}
  </div>
  )
}

export default AddingCategoryError;

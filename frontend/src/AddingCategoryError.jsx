import { useEffect } from 'react';

function AddingCategoryError({errorList, setErrorList}) {
  useEffect(() => {
    setErrorList([]);
  }, [])

  function displayError(error) {
    switch (error) {
      case 11:
        return (<p className="login-error">El tipo no puede estar vacío.</p>)
      case 12:
        return (<p className="login-error">El tipo no puede tener mas de 30 caracteres.</p>)
      case 21:
        return (<p className="login-error">El percentage de regalias debe estar un numero.</p>)
      case 22:
        return (<p className="login-error">El percentage de regalias no puede estar vacío.</p>)
      case 31:
        return (<p className="login-error">El percentage de gestion de tiendas debe estar un numero.</p>)
      case 32:
        return (<p className="login-error">El percentage de gestion de tiendas no puede estar vacío.</p>)
      case 41:
        return (<p className="login-error">El minima de gestion debe estar un numero.</p>)
      case 42:
        return (<p className="login-error">El minima de gestion no puede estar vacío.</p>)
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

export default AddingCategoryError;

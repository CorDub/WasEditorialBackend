import { useEffect, useState } from "react";

function ErrorsList({ errors, setErrors }) {

  useEffect(()=> {
    setErrors([]);
  }, [])

  return (
    <div className="general-errors">
      {errors.flat().length === 0 ?
        null :
        errors.flat().map((error, index) => (
          <div key={index} className="login-error">
            <p className="login-error">{error}</p>
          </div>
        ))
      }
    </div>
  )
}

export default ErrorsList;

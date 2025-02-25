import { useEffect } from "react";

function ErrorsList({ errors, setErrors }) {

  useEffect(()=> {
    setErrors([]);
  }, [])
  
  return (
    <div className="login-errors">
      {errors.length === 0 ?
        null :
        errors.map((error, index) => (
          <div key={index} className="login-error">
            <p className="login-error">{error}</p>
          </div>
        ))
      }
    </div>
  )
}

export default ErrorsList;

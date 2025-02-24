import { useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser"

function ErrorsList({ errors, setErrors }) {
  useCheckUser();

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

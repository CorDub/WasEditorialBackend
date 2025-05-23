import { useEffect } from "react";
import useCheckUser from "./customHooks/useCheckUser";

function LoginError({ errors, setErrors, inputs }) {
  useCheckUser();

  console.log("errors in LoginError", errors);

  function displayError(error) {
    if (error === 1) {
      inputs.forEach((input) => {
        if (!input.classList.contains("error-inputs"))  {
          input.classList.add("error-inputs");
        }
      })
      return (
        <p className="login-error">El correo o la contraseña no son válidos</p>
      )
    }

    if (error === 2) {
      if (!inputs[0].classList.contains("error-inputs"))  {
        inputs[0].classList.add("error-inputs");
      }
      return (
        <p className="login-error">El correo no puede estar vacio</p>
      )
    }

    if (error === 3) {
      if (!inputs[1].classList.contains("error-inputs"))  {
        inputs[1].classList.add("error-inputs");
      }
      return (
        <p className="login-error">La contraseña no puede estar vacia</p>
      )
    }

    if (error === 4) {
      if (!inputs[0].classList.contains("error-inputs"))  {
        inputs[0].classList.add("error-inputs");
      }
      return (
        <p className="login-error">El correo no es un correo valido.</p>
      )
    }
  }

  //reseting Errors in the parent component Login so that state can be transformed on submit again,
  //not blocking the whole submit process.
  useEffect(() => {
    setErrors([]);
  }, []);

  return(
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
};

export default LoginError;

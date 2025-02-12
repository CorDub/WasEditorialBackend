import useCheckUser from "./useCheckUser";

function LoginError({ errors, setErrors }) {
  useCheckUser();
  console.log(errors);

  const errorStrings = [
    "El correo o la contraseña no son válidos",
    "El correo no puede estar vacio",
    "La contraseña no puede estar vacia",
  ]

  return(
    <>
      {errors.length === 0 ?
        null :
        errors.map((error, index) => (
          <p key={index}>{errorStrings[index]}</p>
        ))
      }
    </>
  )
};

export default LoginError;

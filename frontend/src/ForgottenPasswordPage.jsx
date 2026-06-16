import { useState, useRef } from "react";
// import { useNavigate } from "react-router-dom";
import './ForgottenPasswordPage.scss';
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import Alert from './Alert';
import LoadingWheel from "./LoadingWheel";

function ForgottenPasswordPage() {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [correo1, setCorreo1] = useState("")
  const [correo2, setCorreo2] = useState("")
  // const navigate = useNavigate();
  const [errors, setErrors] = useState([]);
  const email1Ref = useRef();
  const email2Ref = useRef();
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isLoading, setLoading] = useState(false);

  async function sendToServer() {
    try {
      if (correo1 !== correo2) {
        setErrors(prev => [...prev, "Los correos ingresados no eran los mismos."])
      }

      setLoading(true)
      const response = await fetch(`${baseURL}/api/user/reset`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          email: correo1
        })
      });

      if (response.ok === false) {
        return console.error(response.status);
      };

      if (response.status === 400) {
        const alertMessage = "No cuenta con este correo fue encontrada.";
        setAlertMessage(alertMessage);
        setAlertType("error");
      };

      if (response.status === 200) {
        setLoading(false)
        setEmailSent(true)
      }

      // const data = await response.json();
      // navigate("/confirmation-code", {state: {user_id: data.id}});

    } catch(error) {
      console.error("Error on sending forgotten password request:", error)
    }
  }

  function checkInputs() {
    let errorsList = []
    const Expectations = {
      type: "string",
      presence: "not empty",
      length: 50
    };

    const errorsEmail1 = checkForErrors("correo 1", correo1, Expectations, email1Ref);
    const errorsEmail2 = checkForErrors("correo 2", correo2, Expectations, email2Ref);
    const errorInputs = [errorsEmail1, errorsEmail2];
    for (const errorInput of errorInputs) {
      if (errorInput.length > 0) {
        errorsList.push(errorInput);
        setErrors(prev => [...prev, errorInput]);
      }
    }

    return errorsList
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  return(
    <div className="forpas">
      {!emailSent ? (
        !isLoading ? (
          <>
            <p>Ingrese su correo por favor</p>
            <form onSubmit={handleSubmit} className="global-form special-forpas">
              <input type="text" placeholder="Correo"
                className="global-input" ref={email1Ref}
                onChange={(e) => setCorreo1(e.target.value)}></input>
              <input type="text" placeholder="Ingrese de nuevo su correo"
                className="global-input" ref={email2Ref}
                onChange={(e) => setCorreo2(e.target.value)}></input>
              <ErrorsList errors={errors} setErrors={setErrors} />
              <button type="submit" className="blue-button" style={{marginTop: "0.5rem"}}>Ingresar</button>
            </form>
          </>
        ) : (
          <LoadingWheel />
        )
        
      ) : (
        <>
          <p>Le hemos enviado un correo con instrucciones para seguir en el proceso.</p>
        </>
      )
      }
    
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default ForgottenPasswordPage;

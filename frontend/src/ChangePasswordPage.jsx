import { useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import "./ChangePasswordPage.scss";
import ChangePasswordPageErrors from "./ChangePasswordPageErrors";
import Alert from "./Alert";

function ChangePasswordPage() {
  const [cs1, setCs1] = useState('');
  const [cs2, setCs2] = useState('');
  const location = useLocation();
  const { user_id } = location.state || {};
  const navigate = useNavigate();
  const [errorList, setErrorList] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');

  async function sendToServer() {
    if (cs1 !== cs2) {
      alert("La contraseña no fue la misma en ambos campos.");
      return;
    };

    const response = await fetch('http://localhost:3000/author/change_password', {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      credentials: "include",
      body: JSON.stringify({
        user_id: user_id,
        password: cs1
      })
    });

    if (response.ok === true) {
      navigate("/", {
        state: {
          alertMessage: "La contraseña se ha actualizada con exito.",
          type: "confirmation"
        }
      });
    } else {
      const res = await response.json();
      if(res.status === 500) {
        setAlertMessage("No se pudó actualizar la contraseña");
        setAlertType("error");
        return;
      };

      checkForErrors(res);
    };
  }

  function addErrorClass(element) {
    if (!element.classList.contains("error-inputs")) {
      element.classList.add("error-inputs");
    };
  }

  function checkForErrors(serverErrors) {
    let newErrorList = [];

    const inputCS1 = document.getElementById('cs1');
    const inputCS2 = document.getElementById('cs2');
    const inputList = [inputCS1, inputCS2];

    inputList.forEach((input) => {
      if (input.classList.contains("error-inputs")) {
        input.classList.remove("error-inputs");
      };
    })

    if (cs1 === "") {
      newErrorList.push(1);
      addErrorClass(inputCS1);
    }

    if (cs2 === "") {
      newErrorList.push(1);
      addErrorClass(inputCS2);
    }

    if (cs1 !== cs2) {
      newErrorList.push(11);
      addErrorClass(inputCS1);
      addErrorClass(inputCS2);
    };

    if (serverErrors) {
      serverErrors.forEach((error) => {
        if (error === 12) {
          newErrorList.push(12);
          addErrorClass(inputCS1);
          addErrorClass(inputCS2);
        }

        if (error === 13) {
          newErrorList.push(13);
          addErrorClass(inputCS1);
          addErrorClass(inputCS2);
        }

        if (error === 14) {
          newErrorList.push(14);
          addErrorClass(inputCS1);
          addErrorClass(inputCS2);
        }
      })
    }

    setErrorList(newErrorList);
    return newErrorList;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const errorList = checkForErrors();
    if (errorList.length > 0) {
      return;
    }
    sendToServer();
  }

  return(
    <div className="chapas">
      <div>
        <p>Cambiar contraseña</p>
      </div>
      <form onSubmit={handleSubmit} className="global-form special-forpas">
        <input type="password" placeholder="Nueva contraseña"
          className="global-input" id="cs1"
          onChange={(e) => setCs1(e.target.value)}></input>
        <input type="password" placeholder="Confirma nueva contraseña"
          className="global-input" id="cs2"
          onChange={(e) => setCs2(e.target.value)}></input>
        <ChangePasswordPageErrors errorList={errorList} setErrorList={setErrorList}/>
        <button type="submit" className="blue-button">Ingresar</button>
      </form>
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default ChangePasswordPage;

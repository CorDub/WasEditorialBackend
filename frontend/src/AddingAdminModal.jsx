import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingAdminModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckSuperAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState([]);
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();
  const roleRef = useRef();

  async function sendToServer() {
    try {
      const response = await fetch(`${baseURL}/api/superadmin/admin`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
          role: role
        }),
      });

      if (response.ok === false) {
        const error = await response.json();
        console.log(error);
        if (error.message) {
          setErrors(prev => [...prev, error.message]);
          return;
        }
        const alertMessage = 'No se pudó crear un nuevo admin.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un(a) nuev(o.a) admin ${data.firstName} ${data.lastName} ha sido creado en la database. 
        Un correo le ha estado enviado para ingresar a la plataforma.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function checkInputs() {
    let errorsList = []
    const Expectations = {
      presence: "not empty",
      type: "string",
    };
    const roleExpectations = {
      presence: "not empty",
      value: ["superadmin", "admin", "author"]
    }
    const emailExpectations = {
      presence: "not empty",
      type: "string",
      validity: "email valid"
    }

    const errorsFirstName = checkForErrors("Nombre", firstName, Expectations, firstNameRef, "o");
    const errorsLastName = checkForErrors("Apellido", lastName, Expectations, lastNameRef, "o");
    const errorsEmail = checkForErrors("Correo", email, emailExpectations, emailRef, "o");
    const errorsRole = checkForErrors("Rol", role, roleExpectations, roleRef, "o");
    const errorInputs = [errorsFirstName, errorsLastName, errorsEmail, errorsRole];
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
    setErrors([]);

    const res = checkInputs();
    if (res.length > 0) {
      return;
    }

    sendToServer()
  }

  function dropDownChange(e, input_name, input_index) {

    const inputs = {
      "Role": {
        "function": setRole,
        "element": roleRef
      }
    }

    if (input_index !== undefined) {
      inputs[input_name]["function"](input_index, e);
      if (e.target.value === "null") {
        if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
          inputs[input_name]["element"].current.classList.remove("selected")
        };
        return;
      } else {
        // inputs[input_name]["function"](input_index, e);
        if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
          inputs[input_name]["element"].current.classList.add("selected")
        };
        return;
      }
    };

    if (e.target.value === "null") {
      inputs[input_name]["function"](null);
      if (inputs[input_name]["element"].current.classList.contains("selected") === true) {
        inputs[input_name]["element"].current.classList.remove("selected")
      };
    } else {
      inputs[input_name]["function"](e.target.value);
      if (inputs[input_name]["element"].current.classList.contains("selected") === false) {
        inputs[input_name]["element"].current.classList.add("selected")
      };
    };
  }

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo admin</p>
      </div>
      <div className="campos-obligatorios">
        <p>*Campos obligatorios</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre*"
          className="global-input" id='adding-author-first-name'
          ref={firstNameRef}
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido*"
          className="global-input" id="adding-author-last-name"
          ref={lastNameRef}
          onChange={(e) => setLastName(e.target.value)}></input>
        <input type='text' placeholder="Correo*"
          className="global-input" id="adding-author-email"
          ref={emailRef}
          onChange={(e) => setEmail(e.target.value)}></input>
        <select onChange={(e) => dropDownChange(e, "Role")} className="select-global"
          ref={roleRef}>
          <option value="null">Selecciona rol*</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
        </select>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div>
          <p style={{
            fontSize:"14px", 
            textAlign: "center", 
            marginRight: "0.5rem",
            marginLeft: "0.5rem"
          }}>Añadir un nuevo admin en la base de datos le manda 
            automaticamente un correo para ingresar en la plataforma.</p>
        </div>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
    </div>
  )
}

export default AddingAdminModal;

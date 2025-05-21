import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditAdminModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckSuperAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';

  const [firstName, setFirstName] = useState(clickedRow.first_name);
  const [lastName, setLastName] = useState(clickedRow.last_name);
  const [email, setEmail] = useState(clickedRow.email);
  const [role, setRole] = useState(clickedRow.role);
  const [errors, setErrors] = useState([]);
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();
  const roleRef = useRef();

  async function sendToServer() {
    try {
      console.log(lastName);
      const response = await fetch(`${baseURL}/superadmin/admin`, {
        method: "PATCH",
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
        const alertMessage = 'No se pudó actualizar el admin.';
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        // const data = await response.json();
        const alertMessage = `El admin ha sido actualizado con exito.`;
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function checkInputs() {
    let errorsList = []
    const Expectations = {
      type: "string",
      presence: "not empty",
      length: 50
    };
    const roleExpectations = {
      presence: "not empty",
      value: ["superadmin", "admin", "author"]
    }

    const errorsFirstName = checkForErrors("nombre", firstName, Expectations, firstNameRef);
    const errorsLastName = checkForErrors("apellido", lastName, Expectations, lastNameRef);
    const errorsEmail = checkForErrors("correo", email, Expectations, emailRef);
    const errorsRole = checkForErrors("rol", role, roleExpectations, roleRef);
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
        <p>Editar admin</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre"
          value={firstName}
          className="global-input" id='adding-author-first-name'
          ref={firstNameRef}
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido" value={lastName}
          className="global-input" id="adding-author-last-name"
          ref={lastNameRef}
          onChange={(e) => setLastName(e.target.value)}></input>
        <input type='text' placeholder="Correo" value={email}
          className="global-input" id="adding-author-email"
          ref={emailRef}
          onChange={(e) => setEmail(e.target.value)}></input>
        <select onChange={(e) => dropDownChange(e, "Role")} className="select-global"
          ref={roleRef}>
          <option value={role}>{role}</option>
          <option value="superadmin">Superadmin</option>
          <option value="admin">Admin</option>
          <option value="author">Usuario</option>
        </select>
        <ErrorsList errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Confirmar</button>
        </div>
      </form>
    </div>
  )
}

export default EditAdminModal;

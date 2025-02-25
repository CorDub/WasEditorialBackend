import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function EditAdminModal({ clickedRow, closeModal, pageIndex, globalFilter, setEditModalOpen }) {
  useCheckSuperAdmin();

  const [firstName, setFirstName] = useState(clickedRow.first_name);
  const [lastName, setLastName] = useState(clickedRow.last_name);
  const [email, setEmail] = useState(clickedRow.email);
  const [errors, setErrors] = useState([]);
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();

  async function sendToServer() {
    try {
      console.log(lastName);
      const response = await fetch('http://localhost:3000/superadmin/admin', {
        method: "PATCH",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: "include",
        body: JSON.stringify({
          firstName: firstName,
          lastName: lastName,
          email: email,
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
        setEditModalOpen(false);
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        // const data = await response.json();
        const alertMessage = `El admin ha sido actualizado con exito.`;
        setEditModalOpen(false);
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

    const errorsFirstName = checkForErrors("nombre", firstName, Expectations, firstNameRef);
    if (errorsFirstName.length > 0) {
      errorsList.push(errorsFirstName);
      setErrors(errorsFirstName)
    }

    const errorsLastName = checkForErrors("apellido", lastName, Expectations, lastNameRef);
    if (errorsLastName.length > 0) {
      errorsList.push(errorsLastName);
      setErrors(errorsLastName)
    }

    const errorsEmail = checkForErrors("correo", email, Expectations, emailRef);
    if (errorsEmail.length > 0) {
      errorsList.push(errorsEmail);
      setErrors(errorsEmail)
    }

    return errorsList
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const res = checkInputs();
    console.log(res);
    if (res.length > 0) {
      return;
    }

    sendToServer()
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

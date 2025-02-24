import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";
import { useState, useRef } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function AddingAdminModal({ closeModal, pageIndex, globalFilter, setAddingModalOpen }) {
  useCheckSuperAdmin();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState([]);
  const firstNameRef = useRef();
  const lastNameRef = useRef();
  const emailRef = useRef();

  async function sendToServer() {
    try {
      const response = await fetch('http://localhost:3000/superadmin/admin', {
        method: "POST",
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
        const alertMessage = 'No se pudó crear un nuevo admin.';
        setAddingModalOpen(false);
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      } else {
        const data = await response.json();
        const alertMessage = `Un(a) nuev(o.a) admin ${data.firstName} ${data.lastName} ha sido creado en la database con el correo ${data.email}.
        Su contraseña se ha sido enviado por correo.`;
        setAddingModalOpen(false);
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      }

    } catch(error) {
      console.error(error);
    }
  }

  function checkInputs() {
    const Expectations = {
      type: "string",
      presence: "not empty",
      length: 50
    };
    setErrors(prev => [...prev, checkForErrors("Apellido", lastName, Expectations, firstNameRef)]);
    setErrors(prev => [...prev, checkForErrors("Nombre", firstName, Expectations, lastNameRef)]);
    setErrors(prev => [...prev, checkForErrors("Correo", email, Expectations, emailRef)]);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    checkInputs();
    if (errors.length > 0) {
      return;
    }

    sendToServer()
  }

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo autor</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre"
          className="global-input" id='adding-author-first-name'
          ref={firstNameRef}
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido"
          className="global-input" id="adding-author-last-name"
          ref={lastNameRef}
          onChange={(e) => setLastName(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          className="global-input" id="adding-author-email"
          ref={emailRef}
          onChange={(e) => setEmail(e.target.value)}></input>
        <ErrorsList errors={errors} setErrors={setErrors}/>
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

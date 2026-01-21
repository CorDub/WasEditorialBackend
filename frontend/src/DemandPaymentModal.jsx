import { useState, useContext } from "react";
import "./DemandPaymentModal.scss";
// import UserContext from "./UserContext";
// import { useEffect } from "react";
// import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";
import formatNumber from "./customHooks/formatNumber.jsx";

function DemandPaymentModal({closeModal, paymentInfo}) {
  const [factura, setFactura] = useState(null);
  const [constancia, setConstancia] = useState(null);
  const max_size = 5*1024*1024
  const [errorFactura, setErrorFactura] = useState("");
  const [errorConstancia, setErrorConstancia] = useState("");
  // const [correo, setCorreo] = useState("");
  const baseURL = import.meta.env.VITE_API_URL || '';
  // const { user } = useContext(UserContext)
  // const emailRef = useRef();
  const [errors, setErrors] = useState([]);
  // const [userExtra, setUserExtra] = useState({});

  // useEffect(() => {
  //   if (user.email) {
  //     setCorreo(user.email)
  //   }
  // }, [user])

  function checkFile(e, type) {
    const file = e.target.files[0];
    if (!file) {
      if (type === "factura") {
        setErrorFactura("La factura no puede estar vacía.")
      } else if (type === "constancia") {
        setErrorConstancia("La constancia no puede estar vacía.")
      }
      return;
    }

    if (file.type !== "application/pdf"
      && file.type !== "image/jpeg"
      && file.type !== "image/png"
    ) {
      if (type === "factura") {
        setErrorFactura("La factura debe ser de typo pdf, jpeg o png.")
      } else if (type === "constancia") {
        setErrorConstancia("La constancia debe ser de typo pdf, jpeg o png.")
      }
      return;
    }

    if (file.size > max_size) {
      if (type === "factura") {
        setErrorFactura("La factura no puede pesar mas de 5MB.")
      } else if (type === "constancia") {
        setErrorConstancia("La constancia no puede pesar mas de 5MB.")
      }
      return;
    }

    if (type === "factura") {
      setFactura(file)
    } else if (type === "constancia") {
      setConstancia(file)
    } else {
      console.log("Unknown type passed : ", type);
    }
  }

  async function sendInvoice() {
    // const errors = checkEmailInput();
    if (errors.length > 0) {
      return;
    }

    if (!factura || !constancia ) {
      if (!factura) {
        setErrorFactura("Factura faltante");
      }
      if (!constancia) {
        setErrorConstancia("Constancia faltante");
      }
      return;
    }

    try {
      const formData = new FormData();
      formData.append("factura", factura);
      formData.append("constancia", constancia);
      formData.append("month", paymentInfo.month);
      formData.append("monthOriginal", paymentInfo.monthOriginal);
      formData.append("amount", paymentInfo.amount);

      const response = await fetch(`${baseURL}/api/author/sendInvoice`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (response.ok) {
        const alertMessage = `Su factura ha estado mandado con exito.`;
        closeModal(true, alertMessage, "confirmation");
      } else {
        const alertMessage = 'No se pudó mandar la factura.';
        closeModal(false, alertMessage, "error");
      }

    } catch(error) {
      console.log(error)
    }
  }

  // function checkEmailInput() {
  //   const errorsList = [];
  //   const expectationsEmail = {
  //     type: "string",
  //     presence: "not empty",
  //     validity: "email valid"
  //   }

  //   const errorsEmail = checkForErrors(
  //     "El correo",
  //     correo,
  //     expectationsEmail,
  //     emailRef,
  //     "o");

  //   if (userExtra.email !== correo) {
  //     errorsList.push("No hay registro de este correo. Por favor verifique el correo o cambielo en su pagina de perfil.")
  //   }

  //   if (errorsEmail.length > 0) {
  //     errorsList.push(errorsEmail);
  //     setErrors(errorsList);
  //     return
  //   }

  //   setErrors(errorsList)
  //   return errorsList;
  // }

  // async function getUserExtra() {
  //   try {
  //     const response = await fetch(`${baseURL}/api/user/user_extra`, {
  //       method: "GET",
  //       headers: {
  //         "Content-Type": "application/json"
  //       },
  //       credentials: "include"
  //     });

  //     if (response.ok) {
  //       const data = await response.json()
  //       setUserExtra(data);
  //     };

  //   } catch(error) {
  //     console.log(error)
  //   }
  // }

  // useEffect(() => {
  //   getUserExtra()
  // }, [])

  return (
    <div className="modal-proper">
      <div className="modal-stuff-to-add">
        <div className="dempay-adicional-info">
          <p className="dempay-bold">Datos requeridos en la factura</p>
          <p>Uso de CFDI: Gastos Generales</p>
          <p>Concepto: Regalías</p>
          <p>Código: 82111702</p>
          {/* <p>y agrega la referencia "55101500 venta de libros + 'título del libro'" a la factura.</p> */}
          <p>-</p>
          <p>No agregar el IVA en la factura.</p>
          <p>-</p>
          <p>El pago será hecho por transferencia y en una sola exhibición.</p>
        </div>
        <div className="modal-payment-amount">
          <p>Importe:</p>
          <p>{paymentInfo.month} - {formatNumber(paymentInfo.amount)}</p>
        </div>
        <div className="modal-form-upload">
          <label className="modal-form-label dempay-title">Factura (pdf, jpeg, png, max 5MB)</label>
          <input type="file"
            className="modal-form-file"
            accept=".pdf,image/jpeg,image/pdf"
            onChange={(e) => checkFile(e, "factura")}/>
          <div className="modal-form-error">{errorFactura}</div>
        </div>
        <div className="modal-form-upload">
          <label className="modal-form-label dempay-title">Constancia de situación fiscal (pdf, jpeg, png, max 5MB)</label>
          <input type="file"
            accept=".pdf,image/jpeg,image/pdf"
            className="modal-form-file"
            onChange={(e) => checkFile(e, "constancia")}/>
          <div className="modal-form-error">{errorConstancia}</div>
        </div>
        {/* <div className="modal-form-line">
          <label className="modal-form-label">Confirme su correo</label>
          <input className="global-input dempay-title"
            value={correo}
            ref = {emailRef}
            onChange={(e) => setCorreo(e.target.value)}>
          </input>
        </div> */}
      </div>
      <div className='centering-errors'>
        <ErrorsList errors={errors} setErrors={setErrors}/>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(false)}>Cancelar</button>
        <button className='blue-button modal-button'
         onClick={sendInvoice}>Confirmar</button>
      </div>
    </div>
  )
}

export default DemandPaymentModal;

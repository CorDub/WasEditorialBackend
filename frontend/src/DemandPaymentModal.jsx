import { useState, useContext, useRef } from "react";
import "./DemandPaymentModal.scss";
import UserContext from "./UserContext";
import { useEffect } from "react";
import checkForErrors from "./customHooks/checkForErrors";
import ErrorsList from "./ErrorsList";

function DemandPaymentModal({closeModal, paymentInfo}) {
  const [uso, setUso] = useState("");
  const [factura, setFactura] = useState(null);
  const [constancia, setConstancia] = useState(null);
  const max_size = 5*1024*1024
  const usosDeCFDI = [
    { clave: "G01", descripcion: "Adquisición de mercancías" },
    { clave: "G02", descripcion: "Devoluciones, descuentos o bonificaciones" },
    { clave: "G03", descripcion: "Gastos en general" },

    { clave: "I01", descripcion: "Construcciones" },
    { clave: "I02", descripcion: "Mobiliario y equipo de oficina por inversiones" },
    { clave: "I03", descripcion: "Equipo de transporte" },
    { clave: "I04", descripcion: "Equipo de cómputo y accesorios" },
    { clave: "I05", descripcion: "Dados, troqueles, moldes, matrices y herramental" },
    { clave: "I06", descripcion: "Comunicaciones telefónicas" },
    { clave: "I07", descripcion: "Comunicaciones satelitales" },
    { clave: "I08", descripcion: "Otra maquinaria y equipo" },

    { clave: "D01", descripcion: "Honorarios médicos, dentales y gastos hospitalarios" },
    { clave: "D02", descripcion: "Gastos médicos por incapacidad o discapacidad" },
    { clave: "D03", descripcion: "Gastos funerarios" },
    { clave: "D04", descripcion: "Donativos" },
    { clave: "D05", descripcion: "Intereses reales efectivamente pagados por créditos hipotecarios" },
    { clave: "D06", descripcion: "Aportaciones voluntarias al SAR" },
    { clave: "D07", descripcion: "Primas por seguros de gastos médicos" },
    { clave: "D08", descripcion: "Gastos de transportación escolar obligatoria" },
    { clave: "D09", descripcion: "Depósitos en cuentas de ahorro / pensiones" },
    { clave: "D10", descripcion: "Pagos por servicios educativos (colegiaturas)" },

    { clave: "S01", descripcion: "Sin efectos fiscales" },
    { clave: "CP01", descripcion: "Pagos" },
    { clave: "CN01", descripcion: "Nómina" }
  ]
  const [errorFactura, setErrorFactura] = useState("");
  const [errorConstancia, setErrorConstancia] = useState("");
  const [errorUso, setErrorUso] = useState("");
  const [correo, setCorreo] = useState("");
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext)
  const emailRef = useRef();
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    if (user.email) {
      setCorreo(user.email)
    }
  }, [user])

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
    const errors = checkEmailInput();
    if (errors.length > 0) {
      return;
    } 

    if (!factura || !constancia || !uso) {
      if (!factura) {
        setErrorFactura("Factura faltante");
      }
      if (!constancia) {
        setErrorConstancia("Constancia faltante");
      }
      if (!uso) {
        setErrorUso("Uso de CFDI faltante");
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
      formData.append("uso", uso);
      formData.append("correo", correo);

      const response = await fetch(`${baseURL}/author/sendInvoice`, {
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

    try {
      if (correo !== user.email) {
        updateEmail()
      }
    } catch (error) {
      console.log(error)
    }
  }

  function checkEmailInput() {
    const errorsList = [];
    const expectationsEmail = {
      type: "string",
      presence: "not empty",
      validity: "email valid"
    }

    const errorsEmail = checkForErrors(
      "El correo", 
      correo, 
      expectationsEmail,
      emailRef,
      "o");
    
    if (errorsEmail.length > 0) {
      errorsList.push(errorsEmail);
      setErrors(errorsList);
      return
    } 

    return errorsEmail;
  }

  async function updateEmail() {
    try {
      const response = await fetch(`${baseURL}/api/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          "email": correo
        })
      });

    } catch(error) {
      console.log(error)
    }
  }

  return (
    <div className="modal-proper">
      <div className="modal-stuff-to-add">
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
        <div className="modal-form-line">
          <label className="modal-form-label">Uso de CFDI</label>
          <select className="select-global dempay-title"
            onChange={(e) => setUso(e.target.value)}>
            <option value=""></option>
            {usosDeCFDI && usosDeCFDI.map((uso, index) => (
              <option key={index} value={uso.clave}>{uso.clave} : {uso.descripcion}</option>
            ))}
          </select>
          <div className="modal-form-error">{errorUso}</div>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Confirme su correo</label>
          <input className="global-input dempay-title"
            value={correo}
            ref = {emailRef}
            onChange={(e) => setCorreo(e.target.value)}>
          </input>
          <div className="modal-form-error">{errorUso}</div>
        </div>
      </div>
      <ErrorsList errors={errors} setErrors={setErrors}/>
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

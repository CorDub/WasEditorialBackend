import { useState } from "react";

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
  const baseURL = import.meta.env.VITE_API_URL || '';

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
      return
    }

    try {
      const formData = new FormData();
      formData.append("factura", factura);
      formData.append("constancia", constancia);
      formData.append("month", paymentInfo.month);
      formData.append("amount", paymentInfo.amount);
      formData.append("uso", uso);

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
  }

  return (
    <div className="modal-proper">
      <div className="modal-stuff-to-add">
        <div className="modal-form-upload">
          <label className="modal-form-label">Factura (pdf, jpeg, png, max 5MB)</label>
          <input type="file"
            className="modal-form-file"
            accept=".pdf,image/jpeg,image/pdf"
            onChange={(e) => checkFile(e, "factura")}/>
          <div className="modal-form-error">{errorFactura}</div>
        </div>
        <div className="modal-form-upload">
          <label className="modal-form-label">Constancia de situación fiscal (pdf, jpeg, png, max 5MB)</label>
          <input type="file"
            accept=".pdf,image/jpeg,image/pdf"
            className="modal-form-file"
            onChange={(e) => checkFile(e, "constancia")}/>
          <div className="modal-form-error">{errorConstancia}</div>
        </div>
        <div className="modal-form-line">
          <label className="modal-form-label">Uso de CFDI</label>
          <select className="select-global"
            onChange={(e) => setUso(e.target.value)}>
            <option value=""></option>
            {usosDeCFDI && usosDeCFDI.map((uso, index) => (
              <option key={index} value={uso.clave}>{uso.clave} : {uso.descripcion}</option>
            ))}
          </select>
          <div className="modal-form-error">{errorUso}</div>
        </div>
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

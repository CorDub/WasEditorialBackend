import { useState } from "react";

function DemandPaymentModal({closeModal}) {
  const [uso, setUso] = useState("");
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

  return (
    <div className="modal-proper">
      <div className="modal-stuff-to-add">
        <div className="modal-form-line">
          <label className="modal-form-label">Uso de CFDI</label>
          <select className="select-global"
            onChange={(e) => setUso(e.target.value)}>
            <option value=""></option>
            {usosDeCFDI && usosDeCFDI.map((uso, index) => (
              <option key={index} value={uso.clave}>{uso.clave} : {uso.descripcion}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="modal-actions">
        <button className='blue-button modal-button'
          onClick={() => closeModal(false)}>Cancelar</button>
        <button className='blue-button modal-button'
         >Confirmar</button>
      </div>
    </div>
  )
}

export default DemandPaymentModal;

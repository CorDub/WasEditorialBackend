import './AddingMultipleAuthorsModal.scss';
import { useState } from "react";

function AddingMultipleAuthorsModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [archivo, setArchivo] = useState(null);
  const [errorFile, setErrorFile] = useState("");

  function checkFile(e) {
    const file = e.target.files[0];
    if (file && !file.name.endsWith(".csv")) {
      setErrorFile("El archivo no era de typo .csv")
    } else {
      setArchivo(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("archivo", archivo)

      const response = await fetch(`${baseURL}/author/addMultiples`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (response.ok) {
        const alertMessage = `Multiples autores han estado añadidos con exito.`;
        closeModal(true, alertMessage, "confirmation");
      } else {
        const alertMessage = "No se pudieron añadir multiples autores.";
        closeModal(false, alertMessage, "error");
      }
    } catch(error) {
      console.log(error)
    }
  }

  return (
    <div className='modal-proper'>
      <div className='global-form'>
        <div className="mulauth-adicional-instruciones">
          <div className="mulauth-top-instrucciones">
            <p className="mulauth-line">Suba un archivo CSV para añadir multiples autores al mismo tiempo.</p>
            <p className="mulauth-line">Por favor no incluye el nombre de las columnas en el archivo</p>
            <p className="mulauth-line">Las columnas deben estar en el siguiente orden:</p>
          </div>
          <div className="mulauth-line">
            <p className="mulauth-line">Nombre*</p>
            <p className="mulauth-line">Apellido*</p>
            <p className="mulauth-line">País</p>
            <p className="mulauth-line">Categoria</p>
            <p className="mulauth-line">Correo</p>
            <p className="mulauth-line">Teléfono</p>
            <p className="mulauth-line">Fecha de nacimiento (dd/mm/aaaa)</p>
            <p className="mulauth-line">CLABE</p>
            <p className="mulauth-line">Nombre del titular</p>
            <p className="mulauth-line">Nombre del banco</p>
            <p className="mulauth-line">Codigo SWIFT</p>
            <p className="mulauth-line">Referido</p>
          </div>
          <div className="mulauth-bottom-instrucciones">
            <p className="mulauth-line">*mandatorios</p>
          </div>
          
        </div>
        <div className="modal-form-upload">
          <label className="modal-form-label">Archivo CSV</label>
          <input 
            type='file'
            className="modal-form-file"
            accept=".csv"
            onChange={(e) => checkFile(e)}/>
          <div className="modal-form-error">{errorFile}</div>
        </div>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </div>
    </div>
  )
}

export default AddingMultipleAuthorsModal;
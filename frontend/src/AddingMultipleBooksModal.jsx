import { useState } from "react";

function AddingMultipleBooksModal({ clickedRow, closeModal, pageIndex, globalFilter }) {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [archivo, setArchivo] = useState(null);
  const [errorFile, setErrorFile] = useState("");

  function checkFile(e) {
    const file = e.target.files[0];
    if (file && !file.name.endsWith(".csv")) {
      setErrorFile("El archivo no era de typo .csv")
      return;
    } else {
      setArchivo(file)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      if (!archivo) {
        setErrorFile("No archivo fue subido")
        return;
      }
      formData.append("archivo", archivo)

      const response = await fetch(`${baseURL}/admin/book/addMultiples`, {
        method: "POST",
        credentials: "include",
        body: formData
      });

      if (response.ok) {
        const responseData = await response.json();
        if (responseData.failed.length > 0) {
          const alertMessage = `Los siguientes libros no pudieron estar añadidos`;
          console.log(responseData)
          closeModal(pageIndex, globalFilter, false, alertMessage, "warning", responseData.failed)
        } else {
          const alertMessage = `Los libros han estado añadidos con exito.`;
          closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
        }
      } else {
        const alertMessage = "No se pudieron añadir varios libros.";
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }
    } catch(error) {
      console.log(error)
    }
  }

  return(
    <div className='modal-proper'>
      <div className='global-form'>
        <div className="mulauth-adicional-instruciones">
          <div className="mulauth-top-instrucciones">
            <p className="mulauth-line">Suba un archivo CSV para añadir varios libros al mismo tiempo.</p>
            <p className="mulauth-line">Por favor no incluye el nombre de las columnas en el archivo</p>
            <p className="mulauth-line">Los autores de los libros deben existir en la base de datos antes de poder añadir sus libros.</p>
            <p className="mulauth-line">Solamente se puede añadir un autor por libro</p>
            <p className="mulauth-line">Si el libro tiene mas de un autor, por favor editen el libro después.</p>
            <p className="mulauth-line">Las columnas deben estar en el siguiente orden:</p>
          </div>
          <div className="mulauth-line">
            <p className="mulauth-line">Precio en WAS*</p>
            <p className="mulauth-line">ISBN</p>
            <p className="mulauth-line">Título*</p>
            <p className="mulauth-line">Nombre del autor</p>
            <p className="mulauth-line">Appellido del autor</p>
            <p className="mulauth-line">Pasta - solamente "Blanda" o "Dura", con majuscula</p>
            <p className="mulauth-line">Cantidad inicial imprimida*</p>
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

export default AddingMultipleBooksModal;
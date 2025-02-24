import useCheckSuperAdmin from "./customHooks/useCheckSuperAdmin";

function AddingAdminModal({ closeModal, pageIndex, globalFilter }) {
  useCheckSuperAdmin();

  return (
    <div className="modal-proper">
      <div className="form-title">
        <p>Nuevo autor</p>
      </div>
      <form className="global-form">
        <input type='text' placeholder="Nombre"
          className="global-input" id='adding-author-first-name'
          onChange={(e) => setFirstName(e.target.value)}></input>
        <input type='text' placeholder="Apellido"
          className="global-input" id="adding-author-last-name"
          onChange={(e) => setLastName(e.target.value)}></input>
        <select className="select-global"
          id="country-select"
          onChange={(e) => dropDownChange(e, "Country")} >
          <option value="null">País</option>
          {countries.map((country, index) => (
            <option key={index} value={country}>{country}</option>
          ))}
        </select>
        <input type='text' placeholder="Referido (opcional)"
          className="global-input" id="adding-author-referido"
          onChange={(e) => setReferido(e.target.value)}></input>
        <input type='text' placeholder="Correo"
          className="global-input" id="adding-author-email"
          onChange={(e) => setEmail(e.target.value)}></input>
        <select className="select-global" id="category-select"
          onChange={(e) => dropDownChange(e, "Category")}>
          <option value="null">Categoría</option>
          {categories && categories.map((category, index) => (
            <option key={index} value={category.type}>{category.type}</option>
          ))}
        </select>
        <AddingAuthorModalErrors errors={errors} setErrors={setErrors}/>
        <div className="form-actions">
          <button type="button" className='blue-button'
            onClick={() => closeAddingModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
        </div>
      </form>
    </div>
  )
}

export default AddingAdminModal;

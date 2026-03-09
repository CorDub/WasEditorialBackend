import "./InventoryWASTotal.scss"

function InventoryWASTotal({wasData}){

  return (
    <div className="inventory-was-total">
      <div className="iwt-headers">
        <div>
          Nombre
        </div>
        <div>
          Impresion inicial
        </div>
        <div>
          extra impresiones
        </div>
        <div>
          devueltos
        </div>
        <div>
          Disponibles
        </div>
      </div>
      <div className="iwt-values"></div>
    </div>
  )
}

export default InventoryWASTotal;
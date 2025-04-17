import './ShowInventories.scss';

function ShowInventories({inventories}) {
  console.log(inventories)

  return (
    inventories && (
      <div id='show-inventory-container'>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Inventario inicial</p>
          <p className="author-inventory-number">{inventories.summary.initial || 0}</p>
        </div>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Libros entregados al autor</p>
          <p className="author-inventory-number">{inventories.initial || 0}</p>
        </div>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Libros vendidos</p>
          <p className="author-inventory-number">{inventories.summary.sold || 0}</p>
        </div>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Inventario en librerías</p>
          <p className="author-inventory-number">{inventories.summary.bookstores || 0}</p>
        </div>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Libros en bodega Was</p>
          <p className="author-inventory-number">{inventories.summary.was || 0}</p>
        </div>
        <div className="author-inventory-line">
          <p className="author-inventory-label">Inventario total disponible</p>
          <p className="author-inventory-number">{inventories.summary.total || 0}</p>
        </div>
      </div>
    )
  )
}

export default ShowInventories;

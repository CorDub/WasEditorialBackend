import React from 'react';
import './ShowInventories.scss';

function ShowInventories(props) {

    const { inventories } = props;

    
    return (
      <div id='show-inventory-container'>
        {inventories && ( 
          <table className="inventory-table">
            <tbody>
              <tr>
                <td>INVENTARIO INICIAL</td>
                <td>{inventories.summary.initial}</td>
              </tr>
              <tr>
                <td>LIBROS ENTREGADOS AL AUTOR</td>
                <td>{inventories.initial || "?"}</td>
                <button id='show-inventory-detail-button'>VER DETALLES</button>
              </tr>
              <tr>
                <td>LIBROS VENDIDOS</td>
                <td>{inventories.summary.sold}</td>
              </tr>
              <tr>
                <td>INVENTARIO EN LIBRERÍAS</td>
                <td>{inventories.initial || "?"}</td>
              </tr>
              <tr>
                <td>LIBROS EN BODEGA WAS</td>
                <td>{inventories.initial || "?"}</td>
              </tr>
              <tr>
                <td>INVENTARIO TOTAL</td>
                <td>{inventories.summary.total}</td>
              </tr>
            </tbody>
          </table>
        )}
     </div>
    )
}  

export default ShowInventories
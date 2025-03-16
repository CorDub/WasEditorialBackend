import React from 'react';

function ShowInventories(props) {

    const { inventories } = props;

    
    return (
        inventories && ( 
        <ul>
          <li>Inventario inicial: {inventories.summary.initial}</li>
          <li>Libros entregados al autor: {inventories.initial} || ?</li>
          <li>Libros vendidos: {inventories.summary.sold}</li>
          <li>Inventario en librerías: {inventories.initial}|| ?</li>
          <li>Libros en bodega WAS: {inventories.initial}|| ?</li>
          <li>Inventario Total: {inventories.summary.total}</li>
        </ul>
        )
    )
}  

export default ShowInventories;
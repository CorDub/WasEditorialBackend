import "./TableRowDetailsHeader.scss"

function TableRowDetailsHeader() {
    return (
        <div className="table-row-details-header">
            <div className="trdh-title">Titulo</div>
            <div className="trdh-sold">Vendidos</div>
            <div className="trdh-price">Precio de venta</div>
            <div className="trdh-comissions">Comisiones 
                <div className="trdh-subtitle">(por libro)</div>
            </div>
            <div className="trdh-share">Parte 
                <div className="trdh-subtitle">(por autor)</div>
            </div>
            <div className="trdh-ganancia">Ganancia 
                <div className="trdh-subtitle">(por libro)</div>
            </div>
            <div className="trdh-total">Total</div>
        </div>
    )
}

export default TableRowDetailsHeader;
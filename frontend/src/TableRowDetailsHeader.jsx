import "./TableRowDetailsHeader.scss"

function TableRowDetailsHeader() {
    return (
        <div className="table-row-details-header">
            <div className="trdh-title">Titulo</div>

                <div className="trdh-sold">Vendidos</div>
                <div className="trdh-price">Precio de venta</div>
                <div className="trdh-comissions">Comisiones (por libro)</div>
                <div className="trdh-share">Perciento (por autor)</div>
                <div className="trdh-ganancia">Ganancia (por libro)</div>

            <div className="trdh-total">Total</div>
        </div>
    )
}

export default TableRowDetailsHeader;
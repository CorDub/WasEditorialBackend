import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";
import Modal from "./Modal";
import Alert from "./Alert";
import UserContext from "./UserContext";

function SalesList () {
  useCheckAdmin();
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [prices, setPrices] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("sale");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");


  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <button onClick={() => openModal("edit", row.original)}
            className="blue-button modal-button">Editar</button>
          <button onClick={() => openModal("delete", row.original)}
            className="blue-button modal-button">Eliminar</button>
        </div>
      )
    },
    {
      header: "Editada",
      accessorKey: "updatedAt"
    },
    {
      header: "Cantidad",
      accessorKey: "quantity"
    },
    {
      header: "Ingresos",
      Cell: ({row}) => {
        const number = row.original.quantity * row.original.inventory.book.price
        return (
          <div>
            {"$ " + number.toLocaleString()}
          </div>
        )
      }
    },
    {
      header: "Ganancia de Was",
      Cell: ({row}) => {
        const ingresos = row.original.quantity * row.original.inventory.book.price
        const remainings = ingresos * row.original.inventory.bookstore.deal_percentage / 100
        return (
          <div>
            {"$ " + remainings.toLocaleString()}
          </div>
        )
      }
    },
    {
      header: "Inventario",
      accessorKey:'completeInventory'
    },
    {
      header: "Creada",
      accessorKey: "createdAt"
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableRowVirtualization: true,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={() => openModal("adding", null)} className="blue-button">Añadir nueva venta</button>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    onGlobalFilterChange: setGlobalFilter,
    state: { globalFilter },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: "60px",
        left: "10px",
        width: "99vw"
      }
    },
    muiTableBodyRowProps: {
      sx: {
        backgroundColor: "#fff",
      }
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "#fff"
      }
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "#fff"
      }
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: "#fff"
      }
    }
  });

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'adding':
        setModalAction("adding");
        break;
      case 'edit':
        setModalAction("edit");
        break;
      case 'delete':
        setModalAction("delete");
        break;
      default:
        console.log("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  async function fetchSales() {
    try {
      const response = await fetch('http://localhost:3000/admin/sales', {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchSales();
  }, [forceRender]);

  useEffect(() => {
    console.log(data);
  }, [data])

  return (
    <div>
      <Navbar subNav={user.role} active={"ventas"}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction}
        clickedRow={clickedRow} closeModal={closeModal}
        globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default SalesList;

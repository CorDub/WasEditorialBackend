import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";
import Modal from "./Modal";
import Alert from "./Alert";
import UserContext from "./UserContext";
import TableActions from "./TableActions";
import LoadingWheel from "./LoadingWheel";

function SalesList () {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("sale");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <TableActions openModal={openModal} row={row} />
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
        const number = row.original.quantity * row.original.inventory.price
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
        const ingresos = row.original.quantity * row.original.inventory.price
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
      header: "Fecha",
      accessorKey: "createdAt"
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: true,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={() => openModal("adding", null)} className="blue-button">Añadir nueva venta</button>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    state: { pagination, globalFilter },
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
    muiTableContainerProps: {
      sx: {
        maxHeight: '81vh',
        overflowY: 'auto'
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
      setLoading(true);
      const response = await fetch(`${baseURL}/admin/sales`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json();
        setData(data);
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchSales();
  }, [forceRender]);

  return (
    <div>
      <Navbar subNav={user.role} active={"ventas"}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction}
        clickedRow={clickedRow} closeModal={closeModal}
        globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel/>}
      {data && !isLoading && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default SalesList;

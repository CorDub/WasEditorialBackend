import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye } from "@fortawesome/free-solid-svg-icons";
import UserContext from "./UserContext";
import Navbar from "./Navbar";
import Alert from "./Alert";
import TableActions from "./TableActions";
import LoadingWheel from "./LoadingWheel";
import Modal from "./Modal";
import "./PaymentsList.scss";
import formatNumber from "./customHooks/formatNumber";

function PaymentsList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  // Abre las pantallas del autor (modo "ver como autor") para verificar su desglose.
  function viewAsAuthor(row) {
    const authorId = row.original.userId;
    const authorName = encodeURIComponent(
      `${row.original.user?.first_name ?? ""} ${row.original.user?.last_name ?? ""}`.trim()
    );
    navigate(`/author/commissions?authorId=${authorId}&authorName=${authorName}`);
  }
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [chosenPaymentStatus, setChosenPaymentStatus] = useState("solicited");
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("payment");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  });
  const [columnVisibility, setColumnVisibility] = useState({
    "dateMarkedAsPaid": false
  })
  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div style={{ overflow: "visible" }}>
          <TableActions
            openModal={openModal}
            row={row}
            setModalType={setModalType}
            type={"payment"}
            status={chosenPaymentStatus}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: "visible"
        }
      }
    },
    {
      header: "Desglose",
      Cell: ({row}) => (
        <button
          className="view-as-author-btn"
          title="Ver el desglose como lo ve el autor"
          onClick={() => viewAsAuthor(row)}>
          <FontAwesomeIcon icon={faEye} /> Ver desglose
        </button>
      )
    },
    {
      header: "Monto",
      Cell: ({row}) => {
        return (
          <div>
            {formatNumber(row.original.amount)}
          </div>
        )
      }
    },
    {
      header: "Apellido",
      accessorKey:'user.last_name'
    },
    {
      header: "Nombre",
      accessorKey: "user.first_name"
    },
    {
      header: "Mes",
      accessorKey: "forMonth"
    },
    {
      header: "Fecha de pago",
      accessorKey: "dateMarkedAsPaid",
      Cell: ({row}) => {
        return (
          <div>
            {row.original.dateMarkedAsPaid && row.original.dateMarkedAsPaid.substring(0,10)}
          </div>
        )
      }
    }
  ], [chosenPaymentStatus]);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: true,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button" style={{marginLeft:"0.5rem"}}>
        <div><span style={{fontWeight: "bold"}}>Total: </span>{formatNumber(total)}</div>
      </div>
    ),
    initialState: {
      density: 'compact',
    },
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onColumnVisibilityChange: setColumnVisibility,
    state: { pagination, globalFilter, columnVisibility },
    muiTablePaperProps: {
      elevation: 0,
      sx: {
        borderRadius: '15px',
        backgroundColor: "#fff",
        position: "fixed",
        top: "90px",
        left: "10px",
        width: "98.5vw"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '60vh',
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
    muiTableBodyCellProps: {
      sx: {
        fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
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
        setModalType("cost");
        break;
      case 'edit':
        setModalAction("edit");
        setModalType("payment");
        break;
      case 'editCost' :
        setModalAction("edit");
        setModalType("cost");
        break;
      case 'delete' :
        setModalAction("delete");
        setModalType("cost");
        break;
      default:
        console.error("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      setForceRender(prev => !prev);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  async function getPendingPayments() {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/api/admin/payments/payments?status=${chosenPaymentStatus}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      })

      if (response.ok) {
        const data = await response.json();
        setData(data.selectedPayments);
        setTotal(data.totalAmount);
        setLoading(false);
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    getPendingPayments();
  }, [forceRender, chosenPaymentStatus])

  useEffect(() => {
    if (chosenPaymentStatus === "paid") {
      setColumnVisibility({"dateMarkedAsPaid": true})
    } else {
      setColumnVisibility({"dateMarkedAsPaid": false})
    }
  }, [chosenPaymentStatus])

  return(
    <div className="payments-list"
      style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"payments"}/>
      <div className="payment-type-choice">
        {/* <label className="payment-type-label">Pagos seleccionados</label> */}
        <select className="select-global select-payments"
          onChange={(e) => setChosenPaymentStatus(e.target.value)}>
          <option value="solicited">
            Solicitados
          </option>
          <option value="created">
            Todavia no solicitados
          </option>
          <option  value="paid">
            Pagados
          </option>
        </select>
        {/* <div>Añadir un costo addicional solamente se puede hacer con un pago que todavía no esta solicitado</div> */}
      </div>

      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction}
        clickedRow={clickedRow} closeModal={closeModal}
        globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel />}
      {data && !isLoading && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default PaymentsList;

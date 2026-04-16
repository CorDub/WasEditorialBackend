import useCheckAdmin from "./customHooks/useCheckSuperAdmin";
import { useEffect, useState, useMemo, useContext } from "react";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import Navbar from "./Navbar";
import Modal from "./Modal";
import Alert from "./Alert";
import UserContext from "./UserContext";
import TableActions from "./TableActions";
import LoadingWheel from "./LoadingWheel";

function TransfersList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("transfer");
  const [modalAction, setModalAction] = useState('');
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  });
  const columns = useMemo(() => [
    {
      header: "Acciones",
      size: 50,
      Cell: ({row}) => (
        <div style={{ overflow: "visible" }}>
          <TableActions openModal={openModal} row={row}/>
        </div>
      ),
      muiTableBodyCellProps: {
        sx: {
          overflow: "visible"
        }
      }
    },
    {
      header: "Libro",
      accessorKey:'fromInventory.book.title',
      Cell: ({row}) => row.original.fromInventory
        ? row.original.fromInventory.book.title
        : row.original.book.title
    },
    {
      header: "De",
      accessorKey: "fromInventory.bookstore.name",
      Cell: ({row}) => row.original.fromInventory
        ? row.original.fromInventory.bookstore.name
        : "Autor"
    },
    {
      header: "A",
      accessorKey: "toInventory.bookstore.name",
      Cell: ({row}) => row.original.toInventory
        ? row.original.toInventory.bookstore.name
        : row.original.fromInventory
          ? "Autor"
          : "WAS Editorial"
    },
    {
      header: "Cantidad",
      accessorKey: "quantity"
    },
    {
      header: "Fecha",
      accessorKey: "dateStr"
    }, 
    {
      header: "Nota",
      accessorKey: "note"
    },
    {
      header: "Persona",
      accessorKey: "person"
    },
    {
      header: "Lugar",
      accessorKey: "place"
    }
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
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
        width: "99vw",
      }
    },
    muiTableContainerProps: {
      sx: {
          maxHeight: '79vh',
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

  function chooseCorrectModalType(clickedRow) {
    if (!clickedRow.toInventory && !clickedRow.fromInventory) {
      setModalType("transferFromAuthor")
      return
    }

    if (!clickedRow.toInventory && clickedRow.fromInventory) {
      setModalType("transferToAuthor")
      return
    }

    if (clickedRow.toInventory && clickedRow.fromInventory) {
      setModalType("transfer")
      return
    }
  }

  function openModal(type, clickedRow) {
    setClickedRow(clickedRow);
    switch (type) {
      case 'edit':
        chooseCorrectModalType(clickedRow)
        setModalAction("edit");
        break;
      case 'delete':
        chooseCorrectModalType(clickedRow)
        setModalAction("delete");
        break;
      default:
        console.log("Unknown error")
        return;
    }
    setModalOpen(true);
  }

  function closeModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setModalOpen(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(prev => !prev);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  async function fetchTransfers() {
    try {
      setLoading(true);
      const response = await fetch(`${baseURL}/api/admin/transfers`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
        setLoading(false);
      } else {
        console.log("response was not ok:", response.status);
      };

    } catch (error) {
      console.error("Error when fetching transfers in frontend:", error);
    }
  }

  useEffect(() => {
    fetchTransfers();
  }, [forceRender]);

  return (
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"transfers"}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />}
      {isLoading && <LoadingWheel />}
      <div className="contain">
        {data && !isLoading && <MaterialReactTable table={table}/>}
      </div>
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default TransfersList;
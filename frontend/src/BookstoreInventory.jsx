import { useState, useEffect, useRef, useMemo } from "react";
import useCheckAdmin from './customHooks/useCheckAdmin';
import "./BookstoreInventory.scss";
import InventoryTotal from "./InventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";
import ProgressBar from "./ProgressBar";

function BookstoreInventory({
    selectedBookstore,
    selectedBookstoreNoSpaces,
    selectedBookstoreId,
    selectedLogo,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState([]);
  const bookstoreInventoryRef = useRef()
  const [currentTotal, setCurrentTotal] = useState(0);
  const [initialTotal, setInitialTotal] = useState(0);
  const [returnsTotal, setReturnsTotal] = useState(0);
  const [soldTotal, setSoldTotal] = useState(0);
  const [givenToAuthorTotal, setGivenToAuthorTotal] = useState(0);
  const [clickedRow, setClickedRow] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState("inventory");
  const [modalAction, setModalAction] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [globalFilter, setGlobalFilter] = useState("");
  const [isTableActionsOpen, setTableActionsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <TableActions
            key={isTableActionsOpen}
            openModal={openModal}
            row={row}
            isTableActionsOpen={isTableActionsOpen}
            setTableActionsOpen={setTableActionsOpen}
            setModalType={setModalType}
            type={"inventory"}/>
        </div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%'
        }
      }
    },
    {
      header: "Libro",
      accessorKey:'book.title',
      muiTableHeadCellProps: {
        sx: {
          width: '7%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '7%'
        }
      }
    },
    {
      header: "Vendidos",
      Cell: ({row}) => {
        return (<div>{row.original.totalSales} / {row.original.initial}</div>)
      },
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%'
        }
      }
    },
    {
      header: "Devueltos",
      Cell: ({row}) => (
        <div>{row.original.returns} / {row.original.initial}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%'
        }
      }
    },
    {
      header: "Entregados al autor",
      Cell: ({row}) => (
        <div>{row.original.givenToAuthor} / {row.original.initial}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%'
        }
      }
    },
    {
      header: "Disponibles",
      Cell: ({row}) => (
        <div>{row.original.current - row.original.returns} / {row.original.initial}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%'
        }
      }
    },
    {
      header: "País",
      accessorKey: "country",
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%'
        }
      }
    },
    {
      header: "Progreso",
      Cell: ({row}) => (
        <ProgressBar
          current={row.original.current}
          initial={row.original.initial}
          returns={row.original.returns}
          sold={row.original.totalSales}
          given={row.original.givenToAuthor} />
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '10%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '10%'
        }
      }
    }
  ], [isTableActionsOpen]);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enablePagination: true,
    enableFullScreenToggle: false,
    enableRowVirtualization: false,
    // renderTopToolbarCustomActions: () => (
    //   <div className="table-add-button">
    //     <button onClick={() => openModal("adding", {bookstore: selectedBookstore})} className="blue-button table-button">Añadir nuevo inventario</button>
    //   </div>
    // ),
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
        top: "140px",
        left: "25px",
        width: "97vw"
      }
    },
    muiTableContainerProps: {
      sx: {
        maxHeight: '72vh',
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
        backgroundColor: "#fff",
        overflow: "visible",
      }
    },
    muiTableBodyCellProps: {
      sx: {
        overflow: "visible"
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

  // ensures the modalType is reset to the correct one after you add a transfer
  useEffect(() => {
    if (!isModalOpen) {
      setModalType("inventory");
    }
  }, [modalType, isModalOpen])

  async function getBookstoreInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventoriesByBookstore?bookstoreId=${selectedBookstoreId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data.sortedRelevantInventories);
        setCurrentTotal(data.currentTotal);
        setInitialTotal(data.initialTotal);
        setSoldTotal(data.soldTotal);
        setGivenToAuthorTotal(data.givenToAuthorTotal);
        setReturnsTotal(data.returnsTotal);
      }

    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getBookstoreInventories();
  }, []);

  useEffect(() => {
    requestAnimationFrame(() => {
      bookstoreInventoryRef.current.classList.add("bookstore-inventory-extended");
    });
  }, [selectedBookstore])

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
    setModalType("inventory");
    setTableActionsOpen(prev => !prev);
    globalFilter && setGlobalFilter(globalFilter);
    if (reload === true) {
      getBookstoreInventories();
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return (
    <div
      className="bookstore-inventory"
      ref={bookstoreInventoryRef}>
      <InventoryTotal
        selectedBookstore={selectedBookstore}
        selectedBookstoreNoSpaces={selectedBookstoreNoSpaces}
        selectedLogo={selectedLogo}
        currentTotal={currentTotal}
        initialTotal={initialTotal}
        returnsTotal={returnsTotal}
        givenToAuthorTotal={givenToAuthorTotal}
        soldTotal={soldTotal}
        isBookstoreInventoryOpen={isBookstoreInventoryOpen}
        setBookstoreInventoryOpen={setBookstoreInventoryOpen}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookstoreInventory;

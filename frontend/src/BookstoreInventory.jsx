import { useState, useEffect, useRef, useMemo } from "react";
import useCheckAdmin from './customHooks/useCheckAdmin';
import "./BookstoreInventory.scss";
import InventoryTotal from "./InventoryTotal";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import TableActions from "./TableActions";
import Alert from "./Alert";
import Modal from "./Modal";

function BookstoreInventory({
    selectedBookstoreNoSpaces,
    selectedLogo,
    isBookstoreInventoryOpen,
    setBookstoreInventoryOpen,
    preferredFontSize,
    specificBookstore,
    setSpecificBookstoreOpen}) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [data, setData] = useState([]);
  const bookstoreInventoryRef = useRef()
  const [selectedBookstore, setSelectedBookstore] = useState("");
  const [selectedBookstoreId, setSelectedBookstoreId] = useState(0);
  const [impressions, setImpressions] = useState(0);
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
  const [columnVisibility, setColumnVisibility] = useState({
    "impressions": false, 
    "entregasAlAutor": false});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })

  console.log(data);

  const columns = useMemo(() => [
    {
      header: "Acciones",
      size: 50,
      Cell: ({row}) => (
        <div style={{position:"relative", overflow:"visible !important"}}>
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
          width: '3%',
          overflow: 'visible'
        }
      }
    },
    {
      header: "Libro",
      maxSize: 200,
      accessorKey:'book.title',
      muiTableHeadCellProps: {
        sx: {
          width: '5%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '5%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    // {
    //   header: "Precio",
    //   accessorKey:"price",
    //   muiTableHeadCellProps: {
    //     sx: {
    //       width: '3%'
    //     }
    //   },
    //   muiTableBodyCellProps: {
    //     sx: {
    //       width: '3%',
    //       fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
    //     }
    //   }
    // },
    {
      header: "Inicial",
      size: 50,
      Cell: ({row}) => {
        return (<div>{row.original.initial}</div>)
      },
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    {
      id: "impressions",
      header: "Nuevas impresiónes",
      size: 50,
      Cell: ({row}) => {
        return (<div>{row.original.extraImpressions}</div>)
      },
       muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    {
      header: "Devueltos",
      size: 50,
      Cell: ({row}) => (
        <div>{row.original.returns}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    {
      header: "Vendidos",
      size: 50,
      Cell: ({row}) => {
        return (<div>{row.original.totalSales}</div>)
      },
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    {
      id: "entregasAlAutor",
      size: 50,
      header: "Entregados al autor",
      Cell: ({row}) => (
        <div>{row.original.givenToAuthor}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    {
      header: "Disponibles",
      size: 50,
      Cell: ({row}) => (
        <div>{selectedBookstoreId === 1 
          ? row.original.current + row.original.returns
          : row.original.current - row.original.returns}</div>
      ),
      muiTableHeadCellProps: {
        sx: {
          width: '3%'
        }
      },
      muiTableBodyCellProps: {
        sx: {
          width: '3%',
          fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        }
      }
    },
    // {
    //   header: "País",
    //   accessorKey: "country",
    //   muiTableHeadCellProps: {
    //     sx: {
    //       width: '3%'
    //     }
    //   },
    //   muiTableBodyCellProps: {
    //     sx: {
    //       width: '3%',
    //       fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
    //     }
    //   }
    // },
    // {
    //   header: "Progreso",
    //   Cell: ({row}) => (
    //     <ProgressBar
    //       current={row.original.current}
    //       initial={row.original.initial}
    //       returns={row.original.returns}
    //       sold={row.original.totalSales}
    //       given={row.original.givenToAuthor} />
    //   ),
    //   muiTableHeadCellProps: {
    //     sx: {
    //       width: '10%'
    //     }
    //   },
    //   muiTableBodyCellProps: {
    //     sx: {
    //       width: '10%',
    //     }
    //   }
    // }
  ], [isTableActionsOpen]);
  const table = useMaterialReactTable({
    columns,
    data,
    localization: {
      noRecordsToDisplay: 'Descargando datos'
    },
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
    onColumnVisibilityChange: setColumnVisibility,
    state: { pagination, globalFilter, columnVisibility },
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
        maxHeight: '65vh',
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
        position: "relative",
        fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem) !important`,
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis"
      },
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

  useEffect(() => {
    if (specificBookstore) {
      console.log(specificBookstore)
      setData(specificBookstore.sortedRelevantInventories)
      setSelectedBookstoreId(specificBookstore.id)
      setSelectedBookstore(specificBookstore.name)
      setCurrentTotal(specificBookstore.currentTotal)
      setInitialTotal(specificBookstore.initialTotal)
      setSoldTotal(specificBookstore.soldTotal)
      setGivenToAuthorTotal(specificBookstore.givenToAuthorTotal)
      setReturnsTotal(specificBookstore.returnsTotal)
      setImpressions(specificBookstore.extraImpressionsTotal)

      if (specificBookstore.id === 1) {
        setColumnVisibility(
          {
            'impressions': true,
            'entregasAlAutor': true
          })
      } else {
        setColumnVisibility(
          {
            'impressions': false,
            'entregasAlAutor': false
          }
        )
      }
    }
  }, [specificBookstore])

  async function getBookstoreInventories() {
    try {
      const response = await fetch(`${baseURL}/api/admin/inventoriesByBookstore/${selectedBookstoreId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data.sortedRelevantInventories);
        setSelectedBookstoreId(data.id)
        setSelectedBookstore(data.name)
        setCurrentTotal(data.currentTotal);
        setInitialTotal(data.initialTotal);
        setSoldTotal(data.soldTotal);
        setGivenToAuthorTotal(data.givenToAuthorTotal);
        setReturnsTotal(data.returnsTotal);
        setImpressions(data.extraImpressionsTotal)
      }

    } catch (error) {
      console.log(error)
    }
  }

  // useEffect(() => {
  //   getBookstoreInventories();
  // }, []);

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
      ref={bookstoreInventoryRef}
      style={{fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
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
        setBookstoreInventoryOpen={setBookstoreInventoryOpen}
        preferredFontSize={preferredFontSize}
        setSpecificBookstoreOpen={setSpecificBookstoreOpen}
        impressions={impressions}/>
      {isModalOpen && <Modal modalType={modalType} modalAction={modalAction} clickedRow={clickedRow}
          closeModal={closeModal} globalFilter={globalFilter} />}
      {data && <MaterialReactTable table={table}/>}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType}/>
    </div>
  )
}

export default BookstoreInventory;

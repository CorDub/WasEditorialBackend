import { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from "./Navbar";
import Alert from "./Alert";
import Modal from "./Modal";
import LoadingWheel from "./LoadingWheel";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import UserContext from './UserContext';
import TableActions from "./TableActions";
import BookstoreInventory from './BookstoreInventory';
import BookInventory from './BookInventory';

function InventoriesList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [isModalOpen, setModalOpen] = useState(false);
  const [clickedRow, setClickedRow] = useState(null);
  const [modalType, setModalType] = useState("bookstore");
  const [modalAction, setModalAction] = useState('');
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [isTableActionsOpen, setTableActionsOpen] = useState(false);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 30
  })
  const [isLoading, setLoading] = useState(false);
  const [specificBookstore, setSpecificBookstore] = useState({});
  const [specificBook, setSpecificBook] = useState({});
  const [isSpecificBookstoreOpen, setSpecificBookstoreOpen] = useState(false);
  const [isSpecificBookOpen, setSpecificBookOpen] = useState(false);
  const [isInventoryTypeBook, setInventoryType] = useState(false)
  const [columnVisibility, setColumnVisibility] = useState({"extraImpressions": false, "returns": true});

  const columns = useMemo(() => [
    // {
    //   header: "Acciones",
    //   Cell: ({row}) => (
    //     <div style={{position:"relative", overflow:"visible !important"}}>
    //       <TableActions
    //         key={isTableActionsOpen}
    //         openModal={openModal}
    //         row={row}
    //         isTableActionsOpen={isTableActionsOpen}
    //         setTableActionsOpen={setTableActionsOpen}
    //         setModalType={setModalType}
    //         type={"inventory"}/>
    //     </div>
    //   ),
    //   muiTableBodyCellProps: {
    //     sx: {
    //       overflow: "visible"
    //     }
    //   }
    // },
    {
      header: "Nombre",
      accessorKey: "name",
      maxSize: 200,
      Cell: ({row}) => (
        <div
          onClick={() => openSpecifics(row.original.type, row.original.id)}
          className="table-clickable-row">
          {row.original.name}
        </div>
      )
    },
    {
      header: "Copias",
      size: 100,
      accessorKey: "initial",
      Cell: ({row}) => {
        // console.log(row.original)
        return (
          row.original.type === "bookstore" && row.original.bookstoreId === 1 ?
          row.original.initial + row.original.extraImpressions :
          row.original.initial
        )
      }
    },
    {
      header: "Impresiónes",
      size: 100,
      accessorKey: "extraImpressions",
    },
    {
      header: "Vendidos",
      size: 100,
      accessorKey: "sold",
    },
    {
      header: "Devueltos",
      size: 100,
      accessorKey: "returns",
      Cell: ({row}) => (
        // <div>{row.original.id === 1 
        //       ? `+ ${row.original.returns}` 
        //       : `- ${row.original.returns}`}</div>
        <div>{row.original.returns === 0 ? 0 : row.original.id === 1 && row.original.type === "bookstore" ? `+ ${row.original.returns}` : `- ${row.original.returns}`}</div>
      )
    },
    {
      header: "Entregados al autor",
      size: 100,
      accessorKey: "givenToAuthor"
    },
    {
      header: "Disponibles",
      size: 100,
      Cell: ({row}) => (
        row.original.type === "book" ?
          <div>{row.original.initial + row.original.extraImpressions - row.original.sold - row.original.givenToAuthor}</div> :
          <div>{row.original.id === 1 ? 
            row.original.initial - row.original.sold + row.original.returns - row.original.givenToAuthor:
            row.original.initial - row.original.sold - row.original.returns - row.original.givenToAuthor}</div>
      )
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <div
          className={isInventoryTypeBook ? "blue-button-inactive" : "blue-button non-clickable"}
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}
          onClick={() => isInventoryTypeBook && toggleInventoriesType()}>
            Inventarios por librería</div>
        <div
          className={isInventoryTypeBook ? "blue-button non-clickable" : "blue-button-inactive"}
          style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.1rem)`}}
          onClick={() => !isInventoryTypeBook && toggleInventoriesType()}>
            Inventarios por libro</div>
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
        top: "60px",
        left: "10px",
        width: "98.5vw"
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

  async function openSpecifics(type, id) {
    try {
      if (type === "bookstore") {
        const response = await fetch(`${baseURL}/admin/inventoriesByBookstore/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setSpecificBookstore(data);
          setSpecificBookstoreOpen(true);
        }
      } else if (type === "book") {
        const response = await fetch(`${baseURL}/admin/inventoriesByBook/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include"
        });

        if (response.ok) {
          const data = await response.json();
          setSpecificBook(data);
          setSpecificBookOpen(true);
        }
      }
      
    } catch (error) {
      console.log(error)
    }
  }

  async function getBookstoreInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventoriesByBookstore`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    getBookstoreInventories();
  }, []);


  // useEffect(() => {
  //   fetchBookstores();
  // }, [isModalOpen])

  async function getBookInventories() {
    try {
      const response = await fetch(`${baseURL}/admin/inventoriesByBook`, {
        method: "GET",
        header: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        setData(data);
      }

    } catch (error) {
      console.log(error)
    }
  }

  function toggleInventoriesType() {
    const newType = !isInventoryTypeBook;
    setInventoryType(newType);
    if (newType) {
      getBookInventories();
      setColumnVisibility((prev) => ({...prev, extraImpressions: true, returns: false}))
    } else {
      getBookstoreInventories();
      setColumnVisibility((prev) => ({...prev, extraImpressions: false, returns: true}))
    }
  }

  // function openModal(type, clickedRow) {
  //   setClickedRow(clickedRow);
  //   switch (type) {
  //     case 'adding':
  //       setModalAction("adding");
  //       break;
  //     case 'edit':
  //       setModalAction("edit");
  //       break;
  //     case 'delete':
  //       setModalAction("delete");
  //       break;
  //     default:
  //       console.log("Unknown error")
  //       return;
  //   }
  //   setModalOpen(true);
  // }

  // function closeModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
  //   setModalOpen(false);
  //   globalFilter && setGlobalFilter(globalFilter);
  //   pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
  //   if (reload === true) {
  //     setForceRender(!forceRender);
  //   }
  //   if (alertMessage) {
  //     setAlertMessage(alertMessage);
  //     setAlertType(alertType);
  //   }
  // }

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"inventories-list"}/>
      {/* {isModalOpen &&
        <Modal
          modalType={modalType}
          modalAction={modalAction}
          clickedRow={clickedRow}
          closeModal={closeModal}
          pageIndex={pagination.pageIndex}
          globalFilter={globalFilter} />} */}
      {isLoading && <LoadingWheel />}
      {data
        && !isLoading 
        && !isSpecificBookstoreOpen 
        && <MaterialReactTable table={table} />}
      {specificBookstore 
        && isSpecificBookstoreOpen 
        && <BookstoreInventory 
          specificBookstore={specificBookstore}
          setSpecificBookstoreOpen={setSpecificBookstoreOpen}/> }
      {specificBook 
        && isSpecificBookOpen 
        && <BookInventory 
          specificBook={specificBook}
          setSpecificBookOpen={setSpecificBookOpen}/> }
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </div>
  )
}

export default InventoriesList;
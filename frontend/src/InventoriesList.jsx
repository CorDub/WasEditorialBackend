import { useState, useEffect, useMemo, useContext } from 'react';
import Navbar from "./Navbar";
import Alert from "./Alert";
import LoadingWheel from "./LoadingWheel";
import useCheckAdmin from "./customHooks/useCheckAdmin";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import UserContext from './UserContext';
import BookstoreInventory from './BookstoreInventory';
import BookInventory from './BookInventory';

function InventoriesList() {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const { user } = useContext(UserContext);
  const [data, setData] = useState([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
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
  const [columnVisibility, setColumnVisibility] = useState({
    "name": true,
    "initial": true,
    "extraImpressions": true, 
    "copias": false,
    "returns": true,
    "entregadosDelAutor": true,
    "entregadosAlAutor": true,
    "transfers": true,
    "ventas": true,
  });
  
  const columns = useMemo(() => [
    {
      header: "Nombre",
      accessorKey: "name",
      maxSize: 200,
      Cell: ({row}) => {
        return (
        <div
          onClick={() => openSpecifics(row.original.type, row.original.id)}
          className="table-clickable-row">
          {row.original.name}
        </div>
      )}
    },
    {
      header: isInventoryTypeBook ? "Impresión inicial" : "Impresión / Ingreso inicial",
      size: 100,
      accessorKey: "initial",
      Cell: ({row}) => {
        return (
          row.original.impressionInicial || row.original.transferInicial
        )
      }
    },
    {
      header: isInventoryTypeBook ? "Nuveas impresiónes" : "Nuevas impresiónes / ingresos",
      size: 100,
      accessorKey: "extraImpressions",
      Cell: ({row}) => {
        return (row.original.extraImpressions || row.original.extraTransfers || '-')
      }
    },
    {
      header: "Copias",
      accessorKey: "copias",
      size: 100
    },
    {
      header: "Ingresados a otras librerias",
      accessorKey: "transfers",
      size: 100,
      Cell: ({row}) => ( row.original.transfers || "-")
    },
    {
      header: "Vendidos",
      size: 100,
      accessorKey: "ventas",
    },
    {
      header: "Devueltos",
      size: 100,
      accessorKey: "returns",
      Cell: ({row}) => (
        <div>{row.original.returns === 0 
          ? "-"
          : row.original.type === "bookstore" && row.original.id === 1 
            ? `+ ${row.original.returns}` 
            : `- ${row.original.returns}`}</div>
      )
    },
    {
      header: "Entregados al autor",
      size: 100,
      accessorKey: "entregadosAlAutor",
      Cell: ({row}) => ( row.original.entregadosAlAutor || "-")
    },
    {
      header: "Devoluciones del autor",
      accessorKey: "entregadosDelAutor",
      size: 100,
      Cell: ({row}) => ( row.original.entregadosDelAutor || '-')
    },
    {
      header: "Disponibles",
      size: 100,
      accessorKey: "disponibles"
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <>
        <div className="table-button-inventories">
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
        </div>
      </>
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
        const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBookstore/${id}`, {
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
        const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBook/${id}`, {
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
      const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBookstore`, {
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

  async function getBookInventories() {
    try {
      const response = await fetch(`${baseURL}/api/admin/inventories/inventoriesByBook`, {
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
      setColumnVisibility((prev) => ({
        "name": true,
        "initial": true,
        "extraImpressions": true, 
        "copias": false,
        "returns": false,
        // "entregadosDelAutor": true,
        "entregadosAlAutor": true,
        "transfers": false,
        "ventas": true,
      }))
    } else {
      getBookstoreInventories();
      setColumnVisibility((prev) => ({
        "name": true,
        "initial": true,
        "extraImpressions": true, 
        "copias": false,
        "returns": true,
        // "entregadosDelAutor": true,
        "entregadosAlAutor": true,
        "transfers": true,
        "ventas": true,
      }))
    }
  }

  return(
    <div style={{ fontSize: `clamp(0.8rem, ${user.font_size}rem, 1.5rem)`}}>
      <Navbar subNav={user.role} active={"inventories-list"}/>
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

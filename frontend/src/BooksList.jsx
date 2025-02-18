import { useState, useEffect, useMemo } from 'react';
import useCheckUser from "./useCheckUser";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import DeleteBookModal from './DeleteBookModal';
import EditBookModal from './EditBookModal';
import AddingBookModal from './AddingBookModal';
import Navbar from './Navbar';
import Alert from "./Alert";

function BooksList() {
  useCheckUser();
  const [data, setData] = useState([]);
  const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditModalOpen, setOpenEditModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [isAddingModalOpen, setOpenAddingModal] = useState(false);
  const [addingModal, setAddingModal] = useState(null);
  const [globalFilter, setGlobalFilter] = useState("");
  const [forceRender, setForceRender] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("");
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15
  })

  const columns = useMemo(() => [
    {
      header: "Acciones",
      Cell: ({row}) => (
        <div>
          <button onClick={()=>openEditModal(row.original)}
            className="blue-button modal-button">Editar</button>
          <button onClick={()=>openDeleteModal(row.original)}
            className="blue-button modal-button">Eliminar</button>
        </div>
      )
    },
    {
      header: "Titulo",
      accessorKey: "title"
    },
    {
      header: "Pasta",
      accessorKey: "pasta"
    },
    {
      header: "Precio",
      accessorKey: "price"
    },
    {
      header: "ISBN",
      accessorKey: "isbn"
    },
    {
      header: "Autor(es)",
      accessorKey: "authorNames",
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    renderTopToolbarCustomActions: () => (
      <div className="table-add-button">
        <button onClick={openAddingModal} className="blue-button">Añadir nuevo libro</button>
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
        width: "95%",
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

  async function fetchBooks() {
    try {
      const response = await fetch('http://localhost:3000/admin/book', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataBooks = await response.json();
        setData(dataBooks);
      } else {
        console.log("There was an error fetching books:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching books:", error);
    }
  }

  useEffect(() => {
    fetchBooks();
  }, [isDeleteModalOpen, isEditModalOpen, isAddingModalOpen])

  function openDeleteModal(row) {
    setDeleteModal(<DeleteBookModal row={row} closeDeleteModal={closeDeleteModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenDeleteModal(true);
  }

  function closeDeleteModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setDeleteModal(null);
    setOpenDeleteModal(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  function openEditModal(row) {
    setEditModal(<EditBookModal row={row} closeEditModal={closeEditModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenEditModal(true);
  }

  function closeEditModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setEditModal(null);
    setOpenEditModal(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  function openAddingModal() {
    setAddingModal(<AddingBookModal closeAddingModal={closeAddingModal}
      pageIndex={pagination.pageIndex} globalFilter={globalFilter}/>);
    setOpenAddingModal(true);
  }

  function closeAddingModal(pageIndex, globalFilter, reload, alertMessage, alertType) {
    setAddingModal(null);
    setOpenAddingModal(false);
    globalFilter && setGlobalFilter(globalFilter);
    pagination && setPagination(prev => ({...prev, pageIndex: pageIndex}));
    if (reload === true) {
      setForceRender(!forceRender);
    }
    if (alertMessage) {
      setAlertMessage(alertMessage);
      setAlertType(alertType);
    }
  }

  return(
    <>
      <Navbar active={"libros"} />
      {isDeleteModalOpen && deleteModal}
      {isEditModalOpen && editModal}
      {isAddingModalOpen && addingModal}
      {data && <MaterialReactTable table={table} />}
      <Alert message={alertMessage} type={alertType}
        setAlertMessage={setAlertMessage} setAlertType={setAlertType} />
    </>
  )
}

export default BooksList;

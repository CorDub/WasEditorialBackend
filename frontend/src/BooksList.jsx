import { useState, useEffect, useMemo } from 'react';
import useCheckUser from "./useCheckUser";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import DeleteCategoryModal from './DeleteCategoryModal';
import EditCategoryModal from './EditCategoryModal';
import AddingBookModal from './AddingBookModal';

function BooksList() {
  useCheckUser();
  const [data, setData] = useState([]);
  const [isDeleteModalOpen, setOpenDeleteModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [isEditModalOpen, setOpenEditModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [isAddingModalOpen, setOpenAddingModal] = useState(false);
  const [addingModal, setAddingModal] = useState(null);

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
    renderTopToolbarCustomActions: () => (
      <button onClick={openAddingModal} className="blue-button">Añadir nuevo libro</button>
    ),
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
    console.log(data);
  }, [data]);

  useEffect(() => {
    fetchBooks();
  }, [isDeleteModalOpen, isEditModalOpen, isAddingModalOpen])

  function openDeleteModal(row) {
    setDeleteModal(<DeleteCategoryModal row={row} closeDeleteModal={closeDeleteModal}/>);
    setOpenDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteModal(null);
    setOpenDeleteModal(false);
  }

  function openEditModal(row) {
    setEditModal(<EditCategoryModal row={row} closeEditModal={closeEditModal}/>);
    setOpenEditModal(true);
  }

  function closeEditModal() {
    setEditModal(null);
    setOpenEditModal(false);
  }

  function openAddingModal() {
    setAddingModal(<AddingBookModal closeAddingModal={closeAddingModal} />);
    setOpenAddingModal(true);
  }

  function closeAddingModal() {
    setAddingModal(null);
    setOpenAddingModal(false);
  }

  return(
    <>
      {isDeleteModalOpen && deleteModal}
      {isEditModalOpen && editModal}
      {isAddingModalOpen && addingModal}
      {data && <MaterialReactTable table={table} />}
    </>
  )
}

export default BooksList;

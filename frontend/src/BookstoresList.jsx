import { useState, useEffect, useMemo } from 'react';
import useCheckUser from "./useCheckUser";
import { MaterialReactTable, useMaterialReactTable } from 'material-react-table';
import DeleteBookModal from './DeleteBookModal';
import EditBookModal from './EditBookModal';
import AddingBookstoreModal from './AddingBookstoreModal';

function BookstoresList() {
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
      header: "Nombre",
      accessorKey: "name"
    },
    {
      header: "% Acuerdo",
      accessorKey: "deal_percentage"
    },
    {
      header: "Nombre del contacto",
      accessorKey: "contact_name"
    },
    {
      header: "Teléfono",
      accessorKey: "contact_phone"
    },
    {
      header: "Correo",
      accessorKey: "contact_email",
    },
  ], []);
  const table = useMaterialReactTable({
    columns,
    data,
    renderTopToolbarCustomActions: () => (
      <button onClick={openAddingModal} className="blue-button">Añadir nueva librería</button>
    ),
  });

  async function fetchBookstores() {
    try {
      const response = await fetch('http://localhost:3000/admin/bookstore', {
        method: 'GET',
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok === true) {
        const dataBookstores = await response.json();
        setData(dataBookstores);
      } else {
        console.log("There was an error fetching bookstores:", response.status);
      };

    } catch(error) {
      console.error("Error while fetching bookstores:", error);
    }
  }

  useEffect(() => {
    console.log(data);
  }, [data]);

  useEffect(() => {
    fetchBookstores();
  }, [isDeleteModalOpen, isEditModalOpen, isAddingModalOpen])

  function openDeleteModal(row) {
    setDeleteModal(<DeleteBookModal row={row} closeDeleteModal={closeDeleteModal}/>);
    setOpenDeleteModal(true);
  }

  function closeDeleteModal() {
    setDeleteModal(null);
    setOpenDeleteModal(false);
  }

  function openEditModal(row) {
    setEditModal(<EditBookModal row={row} closeEditModal={closeEditModal}/>);
    setOpenEditModal(true);
  }

  function closeEditModal() {
    setEditModal(null);
    setOpenEditModal(false);
  }

  function openAddingModal() {
    setAddingModal(<AddingBookstoreModal closeAddingModal={closeAddingModal} />);
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

export default BookstoresList;

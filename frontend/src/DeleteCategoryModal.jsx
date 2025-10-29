import useCheckAdmin from "./customHooks/useCheckAdmin";
import { useState, useEffect } from "react";
import "./DeleteCategoryModal.scss";

function DeleteCategoryModal( {clickedRow, closeModal, pageIndex, globalFilter }) {
  useCheckAdmin();
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [impactedUsers, setImpactedUsers] = useState(0);
  const [existingCategories, setExistingCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(0);

  async function fetchExistingCategories() {
    try {
      const response = await fetch(`${baseURL}/admin/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include"
      });

      if (response.ok) {
        const data = await response.json();
        let filteredData = []
        for (const category of data) {
          if (category.id === clickedRow.id) {
            continue
          }
          filteredData.push(category);
        }
        setExistingCategories(filteredData);
      }

    } catch(error) {
      console.error("Error while fetching existing categories:", error)
    }
  }

  async function checkImpactedUsers() {
    try {
      const response = await fetch(`${baseURL}/admin/categoryImpactedUsers/${clickedRow.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log(data);
        setImpactedUsers(data.numImpactedUsers);
      } 

    } catch (error) {
      console.error("Error while checking impacted users", error)
    }
  }

  useEffect(() => {
    fetchExistingCategories()
    checkImpactedUsers()
  }, []);

  async function deleteCategory() {
    try {
      const response = await fetch(`${baseURL}/admin/category/${clickedRow.id}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify({"selectedCategory": selectedCategory})
      });

      if (response.ok) {
        const alertMessage = `La categoría ${clickedRow.type} ha sido eliminada con exito.`
        closeModal(pageIndex, globalFilter, true, alertMessage, "confirmation");
      } else {
        const alertMessage = `No se pudó eliminar la categoría ${clickedRow.type}`;
        closeModal(pageIndex, globalFilter, false, alertMessage, "error");
      }

    } catch (error) {
      console.error('Error while deleting category', error)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-proper">
        { impactedUsers > 0
          ?
          <div className="delmod-confirm-other">
            <div className="dco-text">
              <p>{`Quedan ${impactedUsers} autores en la categoría ${clickedRow.type}.`}</p> 
              <p>¿A que categoría quiere asignarlos?</p>
            </div>
            <select className="select-global"
              onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value={0} placeholder="categoría"></option>
              {existingCategories.map((category, index) => (
                <option key={index} value={category.id}>{category.type}</option>
              ))}
            </select>
          </div>
          : 
          <div className="delmod-confirm">
            <p>{`¿Está seguro que quiere eliminar la categoria ${clickedRow.type}?`}</p>
          </div>
        }
        <div className="modal-actions">
          <button className='blue-button modal-button'
            onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
          <button className='blue-button modal-button'
            onClick={deleteCategory}>Confirmar</button>
        </div>
      </div>
    </div>
  )
}

export default DeleteCategoryModal;

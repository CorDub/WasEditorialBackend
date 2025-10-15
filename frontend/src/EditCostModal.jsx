import { useState, useRef, useEffect } from 'react';
import ErrorsList from './ErrorsList';
import checkForErrors from './customHooks/checkForErrors';
import useCheckAdmin from './customHooks/useCheckAdmin';

function EditCostModal({clickedRow, closeModal, pageIndex, globalFilter}) {
    useCheckAdmin();
    const baseURL = import.meta.env.VITE_API_URL || '';
    const [amount, setAmount] = useState(clickedRow.amount);
    const amountRef = useRef();
    const [note, setNote] = useState(clickedRow.note);
    const noteRef = useRef();
    const [errors, setErrors] = useState([]);
    const [existingBooks, setExistingBooks] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState(clickedRow.bookId);
    const bookRef = useRef();

    async function fetchExistingBooks() {
        try {
            const response = await fetch(`${baseURL}/admin/existingBooks`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include"
            });

            if (response.ok) {
                const data = await response.json();
                setExistingBooks(data);
            }
        } catch (error) {
            console.log("Error while fetching existing books:", error);
        }
    }
    
    useEffect(() => {
        fetchExistingBooks();
    }, [])

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors([]);

        const res = checkInputs();
        if (res.length > 0) {
        return;
        }

        sendToServer()
    }

    function checkInputs() {
        let errorsList = []
        const expectationsAmount = {
            type: "number",
            presence: "not empty",
            range: "positive"
        };
        const expectationsNote = {
            type: "string",
            presence: "not empty",
            length: 240
        }

        const errorsAmount = checkForErrors("El monto", parseFloat(amount), expectationsAmount, amountRef, "o");
        const errorsNote = checkForErrors("La nota", note, expectationsNote, noteRef, "a");
        const errorsBook = checkForErrors("El libro", parseInt(selectedBookId), expectationsAmount, bookRef, "o");
        const errorInputs = [errorsAmount, errorsNote, errorsBook];

        for (const errorInput of errorInputs) {
            if (errorInput.length > 0) {
                errorsList.push(errorInput);
                setErrors(prev => [...prev, errorInput]);
            }
        }

        return errorsList
    }

    async function sendToServer() {
        try {
            const response = await fetch(`${baseURL}/admin/cost/${clickedRow.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    note: note,
                    bookId: selectedBookId
                })
            });

            if (response.ok) {
                const alertMessage = 'El costo ha estado actualizado con exitó';
                closeModal(globalFilter, true, alertMessage, "confirmation")
            } else {
                const alertMessage = 'No se pudó actualizar el costo.';
                closeModal(globalFilter, false, alertMessage, "error")
            }
        } catch (error) {
            console.log(error);
        }
    }

    return(
        <div className="modal-proper">
            <div className="form-title">
                <p>Editar costo addicional</p>
            </div>
            <div className="campos-obligatorios">
                <p>*Campos obligatorios</p>
            </div>
            <form className="global-form">
                <select className="select-global"
                    ref={bookRef}
                    value={selectedBookId}
                    onChange={(e) => setSelectedBookId(e.target.value)}>
                    <option value="">Selecciona libro*</option>
                    {existingBooks && existingBooks.map((book, index) => (
                        <option key={index} value={book.id}>{book.title}</option>
                    ))}
                </select>
                <div className="modal-form-line">
                    <label className="modal-form-label">Monto *</label>
                    <input type="text"
                        className="global-input"
                        placeholder="Monto"
                        ref={amountRef}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}/>
                </div>
                <div className="modal-form-line">
                    <label className="modal-form-label">Nota</label>
                    <input type='text'
                        className="global-input"
                        placeholder="Nota para el autor"
                        ref={noteRef}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}/>
                </div>
                <ErrorsList errors={errors} setErrors={setErrors}/>
                <div className="form-actions">
                    <button type="button" 
                        className='blue-button'
                        onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
                    <button type='button' onClick={handleSubmit} className="blue-button">Editar</button>
                </div>
            </form>
        </div>
    )
}

export default EditCostModal;
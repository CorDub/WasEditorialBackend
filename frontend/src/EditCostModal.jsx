import { useState, useRef, useEffect } from 'react';
import ErrorsList from './ErrorsList';
import checkForErrors from './customHooks/checkForErrors';
import useCheckAdmin from './customHooks/useCheckAdmin';
import { changeDateFormat } from "../../backend/utils.js";

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
    const [dateStr, setDateStr] = useState(changeDateFormat(clickedRow.dateStr, "yearFirst"));
    const dateStrRef = useRef();

    async function fetchExistingBooks() {
        try {
            const response = await fetch(`${baseURL}/api/admin/existingBooks`, {
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
            console.error("Error while fetching existing books:", error);
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
            presence: "not empty",
            type: "number",
            range: "positive"
        };
        const expectationsNote = {
            presence: "not empty",
            type: "string",
            length: 240
        };
        const expectationsDateStr = {
            type: "string",
            presence: "not empty",
            range: "no future"
        };

        const errorsAmount = checkForErrors("Monto", parseFloat(amount), expectationsAmount, amountRef, "o");
        const errorsNote = checkForErrors("Nota", note, expectationsNote, noteRef, "a");
        const errorsBook = checkForErrors("Libro", parseInt(selectedBookId), expectationsAmount, bookRef, "o");
        const errorsDateStr = checkForErrors("Fecha", dateStr, expectationsDateStr, dateStrRef, "a");
        const errorInputs = [errorsAmount, errorsNote, errorsBook, errorsDateStr];

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
            const response = await fetch(`${baseURL}/api/admin/cost/${clickedRow.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    amount: parseFloat(amount),
                    note: note,
                    dateStr: dateStr,
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
            console.error(error);
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
                    <label className="modal-form-label">Date *</label>
                    <input type="date"
                        className="global-input"
                        placeholder="Fecha"
                        ref={dateStrRef}
                        value={dateStr}
                        onChange={(e) => setDateStr(e.target.value)}/>
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
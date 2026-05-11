import { useState, useRef, useEffect } from 'react';
import ErrorsList from './ErrorsList';
import checkForErrors from './customHooks/checkForErrors';
import useCheckAdmin from './customHooks/useCheckAdmin';
import { today } from "../../backend/utils.js";

function AddingCostModal({clickedRow, closeModal, pageIndex, globalFilter}) {
    useCheckAdmin();
    const baseURL = import.meta.env.VITE_API_URL || '';
    const [existingBooks, setExistingBooks] = useState([]);
    const [amount, setAmount] = useState(0);
    const amountRef = useRef();
    const [note, setNote] = useState("");
    const noteRef = useRef();
    const [errors, setErrors] = useState([]);
    const [selectedBookId, setSelectedBookId] = useState('');
    const bookRef = useRef();
    const [dateStr, setDateStr] = useState(today());
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
        }
        const expectationsDateStr = {
            type: "string",
            presence: "not empty",
            range: "no future"
        }

        const errorsAmount = checkForErrors("Monto", parseInt(amount), expectationsAmount, amountRef, "o");
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
            const response = await fetch(`${baseURL}/api/admin/cost`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    paymentId: clickedRow ? clickedRow.id : null,
                    amount: amount,
                    dateStr: dateStr,
                    note: note,
                    bookId: selectedBookId
                })
            });

            if (response.ok) {
                const alertMessage = 'Un nuevo costo ha sido creado.';
                closeModal(globalFilter, true, alertMessage, "confirmation")
            } else {
                const alertMessage = 'No se pudó crear un nuevo costo.';
                closeModal(globalFilter, false, alertMessage, "error")
            }
        } catch (error) {
            console.error(error);
        }
    }

    return(
        <div className="modal-proper">
             <div className="form-title">
                <p>Nuevo costo addicional</p>
            </div>
            <div className="campos-obligatorios">
                <p>*Campos obligatorios</p>
            </div>
            <form className="global-form">
                <select className="select-global"
                    ref={bookRef}
                    onChange={(e) => setSelectedBookId(e.target.value)}>
                    <option value="">Selecciona libro*</option>
                    {existingBooks && existingBooks.map((book, index) => (
                        <option key={index} value={book.id}>{book.title}</option>
                    ))}
                </select>
                <input type="text"
                    className="global-input"
                    placeholder="Monto*"
                    ref={amountRef}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}/>
                <input type='date'
                    className="global-input"
                    placeholder="Fecha*"
                    ref={dateStrRef}
                    onChange={(e) => setDateStr(e.target.value)} 
                    value={dateStr}/>
                <input type='text'
                    className="global-input"
                    placeholder="Nota para el autor"
                    ref={noteRef}
                    onChange={(e) => setNote(e.target.value)}/>
                <ErrorsList errors={errors} setErrors={setErrors}/>
                <div className="form-actions">
                    <button type="button" 
                        className='blue-button'
                        onClick={() => closeModal(pageIndex, globalFilter, false)}>Cancelar</button>
                    <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
                </div>
            </form>
        </div>
    )
}

export default AddingCostModal;
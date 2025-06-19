import { useState, useRef } from 'react';
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

        const errorsAmount = checkForErrors("El monto", parseInt(amount), expectationsAmount, amountRef);
        const errorsNote = checkForErrors("La nota", note, expectationsNote, noteRef);
        const errorInputs = [errorsAmount, errorsNote];

        for (const errorInput of errorInputs) {
            if (errorInput.length > 0) {
                errorsList.push(errorInput);
                setErrors(prev => [...prev, errorInput]);
            }
        }

        return errorsList
    }

    console.log(clickedRow);

    async function sendToServer() {
        try {
            const response = await fetch(`${baseURL}/admin/cost/${clickedRow.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    amount: amount,
                    note: note
                })
            });

            if (response.ok) {
                const alertMessage = 'El costo ha estado actualizado con exitó';
                closeModal(globalFilter, true, alertMessage, "confirmation")
            } else {
                const alertMessage = 'No se pudó actulizar el costo.';
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
            <form className="global-form">
                <div className="modal-form-line">
                    <label className="modal-form-label">Monto</label>
                    <input type="text"
                        className="global-input"
                        placeholder="Monto"
                        ref={amountRef}
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value))}/>
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
                    <button type='button' onClick={handleSubmit} className="blue-button">Añadir</button>
                </div>
            </form>
        </div>
    )
}

export default EditCostModal;
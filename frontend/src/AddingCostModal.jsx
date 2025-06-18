import { useState, useRef } from 'react';
import ErrorsList from './ErrorsList';
import checkForErrors from './customHooks/checkForErrors';
import useCheckAdmin from './customHooks/useCheckAdmin';


function AddingCostModal({clickedRow, closeModal, pageIndex, globalFilter}) {
    useCheckAdmin();
    const baseURL = import.meta.env.VITE_API_URL || '';
    const [amount, setAmount] = useState(0);
    const amountRef = useRef();
    const [note, setNote] = useState("");
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

    async function sendToServer() {
        try {
            const response = await fetch(`${baseURL}/admin/cost`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify({
                    paymentId: clickedRow.id,
                    amount: amount,
                    note: note
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
            console.log(error);
        }
    }

    return(
        <div className="modal-proper">
             <div className="form-title">
                <p>Nuevo costo addicional</p>
            </div>
            <form className="global-form">
                <input type="text"
                    className="global-input"
                    placeholder="Monto"
                    ref={amountRef}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}/>
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
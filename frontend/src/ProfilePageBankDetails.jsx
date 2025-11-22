import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPen, faCreditCard, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import useCheckUser from "./customHooks/useCheckUser";
import './ProfilePageBankDetails.scss';
import checkForErrors from "./customHooks/checkForErrors";

function ProfilePageBankDetails({
  preferredFontSize,
  accountNumber,
  accountHolder,
  bank,
  swift,
  setAlertMessage,
  setAlertType,
  forceRender,
  setErrors,
  setForceRender,}) {
  useCheckUser();
  const [isEditOpen, setEditOpen] = useState(false);
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [clabe, setClabe] = useState(accountNumber || '');
  const [bankName, setBankName] = useState(bank || "");
  const [accountHolderName, setAccountHolderName] = useState(accountHolder || "");
  const [newSwift, setNewSwift] = useState(swift || "");
  const clabeRef = useRef();
  const accountHolderRef = useRef();
  const bankRef = useRef();
  const swiftRef = useRef();

  // Update async values that will start undefined
  useEffect(() => {
    setClabe(accountNumber || "");
    setBankName(bank || "");
    setAccountHolderName(accountHolder || "");
    setNewSwift(swift || "");
  }, [accountNumber, bank, accountHolder, swift]);

  async function updateBankDetails() {
    // Check if there are any changes before checking for errors
    if (clabe === accountNumber
      && bankName === bank
      && accountHolderName === accountHolder
      && newSwift === swift) {
        setEditOpen(false);
        return;
      }

    // Check for errors before firing the request
    setErrors([]);

    const errors = checkInputs();
    if (errors.length > 0) {
      return;
    }

    try {
      const response = await fetch(`${baseURL}/api/user/user`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          clabe: clabe,
          name_bank_account: accountHolderName,
          bank: bankName,
          swift: newSwift
        })
      })

      if (response.ok) {
        setEditOpen(false);
        setAlertMessage(`Su cuenta bancaría ha estado actualizado con exitó`);
        setAlertType("confirmation");
        setForceRender(!forceRender);
      } else {
        setAlertMessage(`No se pudó actualizar su cuenta bancaría`);
        setAlertType("error");
      }
    } catch (error) {
      console.log(error)
    }
  }

  function checkInputs() {
    let errorList = []
    const expectationsClabe = {
      type: "string",
      presence: "not empty",
      validity: "clabe valid"
    }
    const expectationsAccountHolder = {
      type: "string",
      presence: "not empty",
    }
    const expectationsBank = {
      type: "string",
      presence: "not empty"
    }
    const expectationsSwift = {
      type: "string",
      validity: "swift valid"
    }

    const expectations = [
      {
        string: "La CLABE",
        value: clabe,
        expectations: expectationsClabe,
        ref: clabeRef
      },
      {
        string: "El titular",
        value: accountHolderName,
        expectations: expectationsAccountHolder,
        ref: accountHolderRef
      },
      {
        string: "El banco",
        value: bankName,
        expectations: expectationsBank,
        ref: bankRef
      },
    ]
    if (newSwift.length > 0) {
      expectations.push({
        string: "El codigo swift",
        value: newSwift,
        expectations: expectationsSwift,
        ref: swiftRef
      });
    }

    for (const expectation of expectations) {
      const errors = checkForErrors(
        expectation.string,
        expectation.value,
        expectation.expectations,
        expectation.ref)
      if (errors.length > 0) {
        errorList.push(errors);
      }
    }
    setErrors(errorList);
    return errorList;
  }

  return(
    <div className="profile-page-line">
      <div className="profile-page-title">
        <FontAwesomeIcon icon={faCreditCard}
          className="profile-page-icon fa-icon"/>
        <h2 style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
          Cuenta bancaria
        </h2>
      </div>
      {isEditOpen
        ? <div className="profile-page-bank-details-open">
            <div className="ppbd-details">
              <div className="ppbd-detail">
                <label className="ppbd-label">CLABE</label>
                <input
                  type="text"
                  className="global-input profile-page-input ppbd-input"
                  value={clabe}
                  onChange={(e) => setClabe(e.target.value)}
                  ref={clabeRef}
                  />
              </div>
              <div className="ppbd-detail">
                <label className="ppbd-label">Titular</label>
                <input
                  type="text"
                  className="global-input profile-page-input ppbd-input"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  ref={accountHolderRef}
                  />
              </div>
              <div className="ppbd-detail">
                <label className="ppbd-label">Banco</label>
                <input
                  type="text"
                  className="global-input profile-page-input ppbd-input"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  ref={bankRef}
                  />

              </div>
              <div className="ppbd-detail">
                <label className="ppbd-label">SWIFT (opcional)</label>
                <input
                  type="text"
                  className="global-input profile-page-input ppbd-input"
                  value={newSwift}
                  onChange={(e) => setNewSwift(e.target.value)}
                  ref={swiftRef}
                  />

              </div>
            </div>
            <FontAwesomeIcon icon={ faCircleCheck }
              className="profile-page-edit profile-page-edit-open fa-icon"
              onClick={updateBankDetails}/>
          </div>
        : <>
          <div className="profile-page-value"
            style={{ fontSize: `clamp(0.8rem, ${preferredFontSize}rem, 1.5rem)`}}>
              {accountNumber ? accountNumber : "No cuenta registrada"}
          </div>
          <FontAwesomeIcon icon={faPen}
            className="profile-page-edit fa-icon"
            onClick={() => setEditOpen(true)} />
          </>}
    </div>
  )
}

export default ProfilePageBankDetails;

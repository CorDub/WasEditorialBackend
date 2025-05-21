import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ConfirmationCodePage.scss";

function ConfirmationCodePage() {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const [cc1, setConfirmationCode1] = useState(null);
  const [cc2, setConfirmationCode2] = useState(null);
  const [cc3, setConfirmationCode3] = useState(null);
  const [cc4, setConfirmationCode4] = useState(null);
  const [cc5, setConfirmationCode5] = useState(null);
  const [cc6, setConfirmationCode6] = useState(null);
  const location = useLocation();
  const id = location.state.user_id;
  const navigate = useNavigate();
  const finalConfirmationCode = parseInt(cc1 + cc2 + cc3 + cc4 + cc5 + cc6);
  const inp1Ref = useRef();
  const inp2Ref = useRef();
  const inp3Ref = useRef();
  const inp4Ref = useRef();
  const inp5Ref = useRef();
  const inp6Ref = useRef();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch(`${baseURL}/api/confirmation_code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: "include",
        body: JSON.stringify({
          confirmation_code: finalConfirmationCode,
          user_id: id
        })
      });

      if (response.ok === false) {
        console.log(response.status);
        alert('El codigo que ingreso no esta correcto');
      } else {
        navigate("/author/change-password", {state: { user_id: id }});
      }

    } catch(error) {
      console.error("Error submitting the confirmation code:", error);
    }
  }

  function changeFocus(ref) {
    ref.current.focus();
  }

  return (
    <div className="ccp">
      <p>Por favor ingrese el codigo de confirmación que le ha esta enviado a su correo.</p>
      <form onSubmit={handleSubmit}>
        <div>
          <input type="text" maxLength='1' id='ccp1'
            className="ccp-input" ref={inp1Ref}
            onChange={(e) => {
              setConfirmationCode1((e.target.value).toString());
              changeFocus(inp2Ref)}}></input>
          <input type="text" maxLength='1' id='ccp2'
            className="ccp-input" ref={inp2Ref}
            onChange={(e) => {
              setConfirmationCode2((e.target.value).toString());
              changeFocus(inp3Ref)}}></input>
          <input type="text" maxLength='1' id='ccp3'
            className="ccp-input" ref={inp3Ref}
            onChange={(e) => {
              setConfirmationCode3((e.target.value).toString());
              changeFocus(inp4Ref)}}></input>
          <input type="text" maxLength='1' id='ccp4'
            className="ccp-input" ref={inp4Ref}
            onChange={(e) => {
              setConfirmationCode4((e.target.value).toString());
              changeFocus(inp5Ref)}}></input>
          <input type="text" maxLength='1' id='ccp5'
            className="ccp-input" ref={inp5Ref}
            onChange={(e) => {
              setConfirmationCode5((e.target.value).toString());
              changeFocus(inp6Ref)}}></input>
          <input type="text" maxLength='1' id='ccp6'
            className="ccp-input" ref={inp6Ref}
            onChange={(e) => setConfirmationCode6((e.target.value).toString())}></input>
        </div>
        <div className='form-actions ccp-actions'>
          <button type='submit' className="blue-button">Submit</button>
        </div>
      </form>
    </div>
  )
}

export default ConfirmationCodePage;

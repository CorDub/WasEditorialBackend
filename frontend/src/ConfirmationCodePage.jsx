import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

function ConfirmationCodePage() {
  const [cc1, setConfirmationCode1] = useState(null);
  const [cc2, setConfirmationCode2] = useState(null);
  const [cc3, setConfirmationCode3] = useState(null);
  const [cc4, setConfirmationCode4] = useState(null);
  const [cc5, setConfirmationCode5] = useState(null);
  const [cc6, setConfirmationCode6] = useState(null);
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email');
  const navigate = useNavigate();
  const finalConfirmationCode = parseInt(cc1 + cc2 + cc3 + cc4 + cc5 + cc6);

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const response = await fetch('/api/confirmation_code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          confirmation_code: finalConfirmationCode,
          email: email
        })
      });

      if (response.ok === false) {
        console.log(response.status);
      }

      if (response.ok === true) {
        console.log("all good");
      }

    } catch(error) {
      console.error("Error submitting the confirmation code:", error);
    }
  }

  return (
    <div className="ccp">
      <form onSubmit={handleSubmit}>
        <input type="text" id='ccp1'
          onChange={(e) => setConfirmationCode1((e.target.value).toString())}></input>
        <input type="text" id='ccp2'
          onChange={(e) => setConfirmationCode2((e.target.value).toString())}></input>
        <input type="text" id='ccp3'
          onChange={(e) => setConfirmationCode3((e.target.value).toString())}></input>
        <input type="text" id='ccp4'
          onChange={(e) => setConfirmationCode4((e.target.value).toString())}></input>
        <input type="text" id='ccp5'
          onChange={(e) => setConfirmationCode5((e.target.value).toString())}></input>
        <input type="text" id='ccp6'
          onChange={(e) => setConfirmationCode6((e.target.value).toString())}></input>
        <button type='submit'>Submit</button>
      </form>
    </div>
  )
}

export default ConfirmationCodePage;

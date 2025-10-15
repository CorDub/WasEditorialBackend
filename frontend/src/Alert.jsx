function Alert({ message, type, alertExtra, setAlertMessage, setAlertType, setAlertExtra }) {
  const alertProper = document.querySelector('.alert-proper');

  if (message.length > 0) {
    alertProper.classList.add(`${type}`, "slide");

    if (type !== "warning") {
      setTimeout(() => {
      alertProper.classList.remove(`${type}`, "slide");
      setAlertMessage("");
      setAlertType("");
    }, 4000);
    }
  }

  function closeAlert() {
    alertProper.classList.remove(`${type}`, "slide");
    setAlertMessage("");
    setAlertType("");
  }

  return (
    <div className="alert-proper">
      <p className="alert-message">{message}</p>
      {type && type === "warning" &&
        ( <div className="alert-warning-list">
            {alertExtra && alertExtra.map((extra, index) => (
              <div key={index}>{`Linea ${extra.line}: ${extra.error}`}</div>
            ))}
            <button className="blue-button button-alert-warning"
            onClick={closeAlert}>Cerrar</button>
          </div>
        )}
    </div>
  )
}

export default Alert;

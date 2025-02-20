function Alert({ message, type, setAlertMessage, setAlertType }) {
  const alertProper = document.querySelector('.alert-proper');
  
  if (message.length > 0) {
    alertProper.classList.add(`${type}`, "slide");

    setTimeout(() => {
      alertProper.classList.remove(`${type}`, "slide");
      setAlertMessage("");
      setAlertType("");
    }, 4000);
  }

  return (
    <div className="alert-proper">
      <p className="alert-message">{message}</p>
    </div>
  )
}

export default Alert;

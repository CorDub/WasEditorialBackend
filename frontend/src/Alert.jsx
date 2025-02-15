function Alert({ message, type }) {
  const alertProper = document.querySelector('.alert-proper');

  if (message.length > 0) {
    alertProper.classList.add(`${type}`, "slide");

    setTimeout(() => {
      alertProper.classList.remove(`${type}`, "slide");
    }, 4000);
  }

  return (
    <div className="alert-proper">
      <p>{message}</p>
    </div>
  )
}

export default Alert;

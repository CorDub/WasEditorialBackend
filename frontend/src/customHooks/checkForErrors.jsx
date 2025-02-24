function checkForErrors(fieldName, fieldValue, fieldExpectations, fieldRef) {
  const errorList = []
  const expectationsList = Object.keys(fieldExpectations);

  function addErrorClass(ref) {
    if (!ref.current.classList.contains("error")) {
      ref.current.classList.add("error");
    }
  }

  if (fieldRef.current.classList.contains("error")) {
    fieldRef.current.classList.remove("error");
  }

  for (const expectation of expectationsList) {
    switch (expectation) {
      case "type":
        if (fieldExpectations.type === "string") {
          continue
        } else if (fieldExpectations.type === "number") {
          if (isNaN(parseFloat(fieldValue))) {
            errorList.push(`${fieldName} debe ser un numero.`);
          }
          addErrorClass(fieldRef);
        } else {
          console.log("A collection type has been passed into the field")
          return;
        }
        break;

      case "presence":
        if (fieldExpectations.presence === "not empty") {
          if (fieldValue === "") {
            errorList.push(`${fieldName} no puede estar vacío.`);
          }
          addErrorClass(fieldRef);
        };
        break;

      case "length":
        if (fieldValue.length > fieldExpectations.length) {
          errorList.push(`${fieldName} no puede tener mas de ${fieldExpectations.length} caracteres.`);
        };
        addErrorClass(fieldRef);
        break;

      default:
        console.log("Unkown expectation error");
        return;
    }
  }
  return errorList;
}

export default checkForErrors;

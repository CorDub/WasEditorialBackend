function checkForErrors(fieldName, fieldValue, fieldExpectations, fieldRef) {
  const errorList = []
  const expectationsList = Object.keys(fieldExpectations);

  if (fieldRef.current.classList.contains("error-inputs")) {
    fieldRef.current.classList.remove("error-inputs");
  }

  function addErrorClass(ref) {
    if (!ref.current.classList.contains("error-inputs")) {
      ref.current.classList.add("error-inputs");
    }
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
          if (fieldValue === "" || fieldValue === 0) {
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

      case "value":
        if (!fieldExpectations.value.includes(fieldValue)) {
          // let str_possibles = ""
          // for (const value of fieldExpectations.value) {
          //   str_possibles += (value + " ")
          // }
          // errorList.push(`${fieldName} debe ser uno de los siguientes: ${str_possibles}.`)
          errorList.push(`${fieldName} debe estar en la lista.`)
        };
        addErrorClass(fieldRef);
        break;

      case "range":
        if (fieldExpectations.range === "positive") {
          if (fieldValue < 0) {
            errorList.push(`${fieldName} no puede ser negativo`)
          };
          addErrorClass(fieldRef);
        }
        break;

      default:
        console.log("Unkown expectation error");
        return;
    }
  }
  return errorList;
}

export default checkForErrors;

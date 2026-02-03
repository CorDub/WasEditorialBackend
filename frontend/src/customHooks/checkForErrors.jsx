function checkForErrors(
  fieldName,
  fieldValue,
  fieldExpectations,
  fieldRef,
  gender
) {
  const errorList = []
  const expectationsList = Object.keys(fieldExpectations);
  const validEmailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const validPhoneRegex = /^\d{6,14}$/;
  const validPhonePrefixRegex = /^\+\d{1,3}$/;
  const validClabeRegex = /^\d{18}$/;
  const validSwiftRegex = /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/;
  const validISBNRegex = /^(?:(?:\d{9}[\dX])|(?:\d{1,5}-\d{1,7}-\d{1,7}-[\dX])|(?:(?:978|979)\d{10})|(?:(?:978|979)-\d{1,5}-\d{1,7}-\d{1,7}-\d))$/
  const validBirthdayRegex = /^(0[1-9]|[12][0-9]|3[01])(0[1-9]|1[0-2])(19\d{2}|20\d{2})$/

  if (fieldRef instanceof HTMLElement) {
    if (fieldRef.classList.contains("error-inputs")) {
      fieldRef.classList.remove("error-inputs");
    };
  } else if (fieldRef.current.classList.contains("error-inputs")) {
    fieldRef.current.classList.remove("error-inputs");
  }

  function addErrorClass(ref) {
    if (ref instanceof HTMLElement) {
      if (!ref.classList.contains("error-inputs")) {
        ref.classList.add("error-inputs");
      }
      return;
    }

    if (!ref.current.classList.contains("error-inputs")) {
      ref.current.classList.add("error-inputs");
    }
  }

  for (const expectation of expectationsList) {
    switch (expectation) {
      case "presence":
        if (fieldExpectations.presence === "not empty") {
          if (fieldName === "El teléfono") {
            if (fieldValue.length < 4) {
              errorList.push(`${fieldName} faltante`);
            }
            addErrorClass(fieldRef);
            return errorList;
          }
          if (fieldValue === "" || fieldValue === 0 || fieldValue === null) {
            errorList.push(`${fieldName} faltante`);
            addErrorClass(fieldRef);
            return errorList;
          }
        };
        break;

      case "type":
        if (fieldExpectations.type === "string") {
          continue
        } else if (fieldExpectations.type === "number") {
          if (isNaN(parseFloat(fieldValue))) {
            errorList.push(`${fieldName} no válid${gender}`);
          }
          addErrorClass(fieldRef);
        } else if (fieldExpectations.type === "datetime") {
          if (new Date(fieldValue) instanceof Date === false) {
            errorList.push(`${fieldName} no válid${gender}. Formato: "aaaa-mm-dd"`)
          }
          addErrorClass(fieldRef);
        } else {
          console.log("A collection type has been passed into the field")
          return;
        }
        break;

      case "length":
        if (fieldValue.length > fieldExpectations.length) {
          errorList.push(`${fieldName} no puede tener mas de ${fieldExpectations.length} caracteres`);
        };
        addErrorClass(fieldRef);
        break;

      case "value":
        if (!fieldExpectations.value.includes(fieldValue)) {
          errorList.push(`${fieldName} debe estar en la lista`)
        };
        addErrorClass(fieldRef);
        break;

      case "range":
        if (fieldExpectations.range === "positive") {
          if (fieldValue < 0) {
            errorList.push(`${fieldName} no puede ser negativ${gender}`)
          };
          addErrorClass(fieldRef);
        } else if (fieldExpectations.range === "no future") {
          if (new Date(fieldValue) > new Date()) {
            errorList.push(`${fieldName} no puede estar en el futuro`)
          };
          addErrorClass(fieldRef);
        }
        break;

      case "maximum":
        if (fieldExpectations.maximum < fieldValue) {
          errorList.push(`${fieldName} es superior al maximo posible. (${fieldExpectations.maximum})`);
          addErrorClass(fieldRef);
        };
        break;

      case "minimum":
        if (fieldExpectations.minimum > fieldValue) {
          errorList.push(`${fieldName} es inferior al minimo posible. (${fieldExpectations.minimum})`);
          addErrorClass(fieldRef);
        };
        break;

      case "validity":
        if (fieldExpectations.validity === "email valid") {
          if (validEmailRegex.test(fieldValue) === false) {
            errorList.push(`${fieldName} no válido`);
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "phone valid") {
          const clean = fieldValue.replace(/\s|\(|\)|-/g, '');
          if (validPhoneRegex.test(clean) === false) {
            errorList.push(`${fieldName} no válido`);
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "phonePrefix valid") {
          if (validPhonePrefixRegex.test(fieldValue) === false) {
            errorList.push(`${fieldName} no válido`)
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "clabe valid") {
          const clean = fieldValue.replace(/\s/g, '');
          if (validClabeRegex.test(clean) === false) {
            errorList.push(`${fieldName} no válida`);
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "swift valid") {
          const clean = fieldValue.replace(/\s/g, '');
          if (validSwiftRegex.test(clean) === false) {
            errorList.push(`${fieldName} no válido`);
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "isbn valid") {
          const clean = fieldValue.replace(/\s/g, '');
          if (validISBNRegex.test(clean) === false) {
            errorList.push(`${fieldName} no válido`);
            addErrorClass(fieldRef);
          }
        } else if (fieldExpectations.validity === "birthday valid") {
          if (validBirthdayRegex.test(fieldValue) === false) {
            errorList.push(`${fieldName} no válida`);
            // addErrorClass(fieldRef);
          }
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

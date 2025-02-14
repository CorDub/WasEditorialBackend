function useDropDownChange(e, input_name) {
  const inputs = {
    "category": {
      "function": setCategory,
      "element": document.getElementById("category-select")
    },
    "country": {
      "function": setCountry,
      "element": document.getElementById("country-select")
    }
  }

  if (!Object.keys(inputs).includes(input_name)) {
    console.log(`You tried to pass ${input_name} but the available keys are ${String(Object.keys(inputs))}`)
  }

  if (e.target.value === "null") {
    inputs[input_name]["function"](null);
    if (inputs[input_name]["element"].classList.contains("selected") === true) {
      inputs[input_name]["element"].classList.remove("selected")
    };
  } else {
    inputs[input_name]["function"](e.target.value);
    if (inputs[input_name]["element"].classList.contains("selected") === false) {
      inputs[input_name]["element"].classList.add("selected")
    };
  };
}

export default useDropDownChange;

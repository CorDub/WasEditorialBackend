function formatNumber(total) {
  if (total === 0
    || total === undefined
  ) {
    return;
  }

  const strTotal = total.toString();
  const splitTotal = strTotal.split(".");
  let firstPart = '';
  for (let i = 0; i < splitTotal[0].length; i++) {
    if ((splitTotal[0].length - i) % 3 === 0 && i !== 0) {
      firstPart += "," + splitTotal[0][i];
    } else {
      firstPart += splitTotal[0][i];
    }
  }

  if (splitTotal.length < 2) {
    return "$ " + firstPart + ".00";
  };

  let secondPart = splitTotal[1].substring(0,2);
  if (secondPart.length === 1) {
    secondPart += "0"
  }
  return "$ " + firstPart + "." + secondPart;
}

export default formatNumber;

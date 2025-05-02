function formatNumber(total) {
  const strTotal = total.toString();
  const splitTotal = strTotal.split(".");
  let firstPart = '';
  for (let i = 0; i < splitTotal[0].length; i++) {
    if ((splitTotal[0].length - i) % 3 === 0) {
      firstPart += " " + splitTotal[0][i];
    } else {
      firstPart += splitTotal[0][i];
    }
  }
  const secondPart = splitTotal[1].substring(0,2);
  return firstPart + "," + secondPart
}

export default formatNumber;

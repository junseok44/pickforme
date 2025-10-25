export function getNumberComma(value: number) {
  if (value === null || value === undefined) {
    return "0";
  }
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

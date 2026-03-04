export function standardScale(data: number[][]): number[][] {
  const nCols = data[0].length;
  const means = new Array(nCols).fill(0);
  const stds = new Array(nCols).fill(0);

  for (const row of data) {
    for (let j = 0; j < nCols; j++) means[j] += row[j];
  }
  for (let j = 0; j < nCols; j++) means[j] /= data.length;

  for (const row of data) {
    for (let j = 0; j < nCols; j++) stds[j] += (row[j] - means[j]) ** 2;
  }
  for (let j = 0; j < nCols; j++) stds[j] = Math.sqrt(stds[j] / data.length);

  return data.map((row) =>
    row.map((val, j) => (stds[j] === 0 ? 0 : (val - means[j]) / stds[j]))
  );
}

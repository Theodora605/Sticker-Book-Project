export class Matrix2d {
  private PRECISION: number = 5;

  private matrix: number[][];

  constructor(matrixStr: string) {
    this.matrix = Array(2)
      .fill(0)
      .map(() => Array(2).fill(0));

    const matrixVals = matrixStr.split(",");

    this.matrix[0][0] = parseFloat(matrixVals[0]);
    this.matrix[0][1] = parseFloat(matrixVals[1]);
    this.matrix[1][0] = parseFloat(matrixVals[2]);
    this.matrix[1][1] = parseFloat(matrixVals[3]);
  }

  public multiply(m: Matrix2d) {
    const a =
      this.matrix[0][0] * m.matrix[0][0] + this.matrix[0][1] * m.matrix[1][0];
    const b =
      this.matrix[0][0] * m.matrix[0][1] + this.matrix[0][1] * m.matrix[1][1];
    const c =
      this.matrix[1][0] * m.matrix[0][0] + this.matrix[1][1] * m.matrix[1][0];
    const d =
      this.matrix[1][0] * m.matrix[0][1] + this.matrix[1][1] * m.matrix[1][1];

    this.matrix[0][0] = a;
    this.matrix[0][1] = b;
    this.matrix[1][0] = c;
    this.matrix[1][1] = d;

    this.strip();
  }

  public rotate(deg: number) {
    const sinVal = Math.sin((deg * Math.PI) / 180);
    const cosVal = Math.cos((deg * Math.PI) / 180);

    const m = new Matrix2d(`${cosVal},${-sinVal},${sinVal},${cosVal}`);
    this.multiply(m);
  }

  private strip() {
    const decimal = Math.pow(10, this.PRECISION);

    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        this.matrix[i][j] = Math.round(this.matrix[i][j] * decimal) / decimal;
      }
    }
  }

  public toString() {
    return `${this.matrix[0][0]},${this.matrix[0][1]},${this.matrix[1][0]},${this.matrix[1][1]}`;
  }
}

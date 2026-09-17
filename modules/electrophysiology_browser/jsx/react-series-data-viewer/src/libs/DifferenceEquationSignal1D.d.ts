/* Type declarations for the untyped DifferenceEquationSignal1D library. */
/* eslint-disable jsdoc/require-jsdoc */

export class DifferenceEquationSignal1D {
  setInput(signal: Float32Array): void;
  setACoefficients(coefficients: Float32Array | number[]): void;
  setBCoefficients(coefficients: Float32Array | number[]): void;
  getOutput(): Float32Array;
  enableBackwardSecondPass(): void;
  disableBackwardSecondPass(): void;
  run(): void;
}
export default DifferenceEquationSignal1D;

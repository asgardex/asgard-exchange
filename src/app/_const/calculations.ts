// import BigNumber from 'bignumber.js';
// import { TokenAmount, tokenAmount } from '@thorchain/asgardex-token';

// // Very simple way to provide a `Maybe` thing
// // Again, it's not a Monad or so, just a very simple TS type :)
// export type Nothing = null | undefined;
// export const Nothing = null as Nothing;
// export type Maybe<T> = T | Nothing;

// export type DoubleSwapCalcData = {
//   X: TokenAmount;
//   Y: TokenAmount;
//   R: TokenAmount;
//   Z: TokenAmount;
//   Py: BigNumber; // price
//   Pr: BigNumber; // price
// };

// export type SingleSwapCalcData = Pick<DoubleSwapCalcData, 'X' | 'Y' | 'Py'>;

// export type StakeCalcData = {
//   R: TokenAmount;
//   T: TokenAmount;
//   Pr: BigNumber;
//   Pt: BigNumber;
// };

// /**
//  * Formula helper to get `YValue`
//  */
// export const getYValue = (
//   xValue: TokenAmount,
//   data: Required<{ X: TokenAmount; Y: TokenAmount }>,
// ): TokenAmount => {
//   const { X, Y } = data;
//   // formula: (xValue + X) ** 2
//   const times = X.amount()
//     .plus(xValue.amount())
//     .pow(2);
//   // formula: (xValue * X * Y) / times
//   const yValue = X.amount()
//     .multipliedBy(Y.amount())
//     .multipliedBy(xValue.amount())
//     .div(times);

//   return tokenAmount(yValue);
// };

// /**
//  * Formula helper to calulculate value for output
//  */
// export const getZValue = (
//   xValue: TokenAmount,
//   data: Required<{
//     R: TokenAmount;
//     X: TokenAmount;
//     Y: TokenAmount;
//     Z: TokenAmount;
//   }>,
// ): TokenAmount => {
//   const { R, Z } = data;
//   const yValue = getYValue(xValue, data).amount();
//   // formula: (yValue + R) ** 2
//   const times = yValue.plus(R.amount()).pow(2);
//   // formula: (yValue * R * Z) / times
//   const result = yValue
//     .multipliedBy(R.amount())
//     .multipliedBy(Z.amount())
//     .div(times);
//   return tokenAmount(result);
// };

// /**
//  * Formula helper to calulculate fee value
//  */
// export const getFee = (
//   xValue: TokenAmount,
//   data: Required<{
//     R: TokenAmount;
//     X: TokenAmount;
//     Y: TokenAmount;
//     Z: TokenAmount;
//   }>,
// ): TokenAmount => {
//   const { R, Z } = data;
//   const yValue = getYValue(xValue, data).amount();
//   // formula: (yValue + R) ** 2
//   const times = yValue.plus(R.amount()).pow(2);
//   // formula: yValue ** 2
//   const yTimes = yValue.pow(2);
//   // formula: (yTimes * Z) / times
//   const result = yTimes.multipliedBy(Z.amount()).div(times);
//   return tokenAmount(result);
// };

// /**
//  * Formula helper to calculate value of `Px`
//  */
// export const getPx = (
//   xValue: TokenAmount,
//   data: Required<{ X: TokenAmount; Y: TokenAmount; Py: BigNumber }>,
// ): BigNumber => {
//   const { X, Y, Py } = data;

//   let result: BigNumber;
//   if (xValue) {
//     const yValue = getYValue(xValue, data).amount();
//     // formula: (Py * (Y - yValue)) / (X + xValue)
//     const a = Y.amount().minus(yValue);
//     const b = X.amount().plus(xValue.amount());
//     result = Py.multipliedBy(a).div(b);
//   } else {
//     // formula: (Py * Y) / X
//     result = Py.multipliedBy(Y.amount()).div(X.amount());
//   }
//   return result;
// };

// /**
//  * Formula helper to calulculate price value
//  */
// export const getPz = (
//   xValue: Maybe<TokenAmount>,
//   data: Required<{
//     X: TokenAmount;
//     Y: TokenAmount;
//     Z: TokenAmount;
//     R: TokenAmount;
//     Pr: BigNumber;
//   }>,
// ): BigNumber => {
//   const { Z, R, Pr } = data;

//   let result: BigNumber;
//   if (xValue) {
//     const zValue = getZValue(xValue, data).amount();
//     const yValue = getYValue(xValue, data).amount();
//     // formula: (Pr * (R + yValue)) / (Z - zValue)
//     const a = R.amount().plus(yValue);
//     const b = Z.amount().minus(zValue);
//     result = Pr.multipliedBy(a).div(b);
//   } else {
//     // formula: (Pr * R) / Z;
//     result = Pr.multipliedBy(R.amount()).div(Z.amount());
//   }
//   return result;
// };

// /**
//  * Formula helper to calulculate slip value
//  */
// export const getSlip = (
//   xValue: TokenAmount,
//   data: Required<{ X: TokenAmount; Y: TokenAmount; R: TokenAmount }>,
// ): BigNumber => {
//   const { R } = data;
//   const yValue = getYValue(xValue, data).amount();
//   // formula: (yValue + R) ** 2
//   const times: BigNumber = yValue.plus(R.amount()).pow(2);
//   // formula: ((yValue * (2 * R + yValue)) / times) * 100
//   const a = R.amount()
//     .multipliedBy(2)
//     .plus(yValue);
//   const slip = yValue
//     .multipliedBy(a)
//     .div(times)
//     .multipliedBy(100);
//   return slip;
// };

// // calculations for stake

// export const getVr = (
//   rValue: Maybe<TokenAmount>,
//   data: Required<{ R: TokenAmount; Pr: BigNumber }>,
// ): TokenAmount => {
//   const { R, Pr } = data;
//   if (rValue) {
//     // formula: (rValue + R) * Pr
//     const value = rValue
//       .amount()
//       .plus(R.amount())
//       .multipliedBy(Pr);
//     return tokenAmount(value);
//   }
//   // formula: R * Pr
//   const value = R.amount().multipliedBy(Pr);
//   return tokenAmount(value);
// };

// export const getSS = (
//   rValue: TokenAmount,
//   tValue: TokenAmount,
//   data: Required<{ R: TokenAmount; T: TokenAmount }>,
// ): TokenAmount => {
//   const { R, T } = data;
//   // formula: ((rValue / (rValue + R) + tValue / (tValue + T)) / 2) * 100;
//   const rRValue = rValue.amount().plus(R.amount());
//   const rTValue = tValue.amount().plus(T.amount());

//   const rResult = rValue.amount().div(rRValue);
//   const tResult = tValue.amount().div(rTValue);

//   const value = rResult
//     .plus(tResult)
//     .div(2)
//     .multipliedBy(100);
//   return tokenAmount(value);
// };

// export const getVss = (
//   rValue: TokenAmount,
//   tValue: TokenAmount,
//   data: Required<{ R: TokenAmount; Pr: BigNumber; T: TokenAmount }>,
// ): TokenAmount => {
//   const Vr = getVr(rValue, data);
//   const Vt = Vr;
//   // formula: (getSS(rValue, tValue, data) / 100) * (Vr + Vt)
//   const ss = getSS(rValue, tValue, data);
//   const sum = Vr.amount().plus(Vt.amount());
//   const value = ss
//     .amount()
//     .div(100)
//     .multipliedBy(sum);
//   return tokenAmount(value);
// };

// export const getRSlip = (
//   rValue: TokenAmount,
//   data: Required<{ R: TokenAmount }>,
// ): TokenAmount => {
//   const { R } = data;
//   // formula: (rValue + R) ** 2
//   const times = rValue
//     .amount()
//     .plus(R.amount())
//     .pow(2);
//   // formula: ((rValue * (2 * R + rValue)) / times) * 100;
//   const rValueX = R.amount()
//     .multipliedBy(2)
//     .plus(rValue.amount());
//   const value = rValue
//     .amount()
//     .multipliedBy(rValueX)
//     .div(times)
//     .multipliedBy(100);
//   return tokenAmount(value);
// };

// export const getTSlip = (
//   tValue: TokenAmount,
//   data: Required<{ T: TokenAmount }>,
// ): TokenAmount => {
//   const { T } = data;
//   // formula (tValue + T) ** 2;
//   const times = tValue
//     .amount()
//     .plus(T.amount())
//     .pow(2);
//   // formula: (tValue * (2 * T + tValue)) / times;
//   const tValueX = T.amount()
//     .multipliedBy(2)
//     .plus(tValue.amount());
//   const value = tValue
//     .amount()
//     .multipliedBy(tValueX)
//     .div(times);
//   return tokenAmount(value);
// };

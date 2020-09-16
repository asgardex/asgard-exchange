export class TransactionDTO {
  count: number;
  txs: Transaction[];
}

export interface AssetAmount {
  asset: string;
  amount: string;
}

export interface TransactionDetail {
  txID: string;
  memo: string;
  address: string;
  coins: AssetAmount[];
}

export class Transaction {

  pool: string;
  type: string; // TODO -> enum this
  status: string; // TODO -> enum this
  in: TransactionDetail;
  out: TransactionDetail[];
  date: number;
  gas: AssetAmount;
  options: {
    priceTarget: string;
    withdrawBasisPoints: string;
    asymmetry: string;
  };
  height: string;
  events: {
    fee: string;
    stakeUnits: string;
    slip: string;
  };
}

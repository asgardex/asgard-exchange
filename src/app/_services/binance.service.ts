import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { HttpClient } from '@angular/common/http';
import { Fee, Fees, TransferFee, DexFees } from '@thorchain/asgardex-binance';
import { Observable } from 'rxjs';
import { TransferFees } from '../_classes/binance-fee';
import { baseAmount } from '@thorchain/asgardex-token';

@Injectable({
  providedIn: 'root'
})
export class BinanceService {

  baseUrl: string;

  constructor(private http: HttpClient) {

    console.log('NETWORK IS: ', environment.network);

    this.baseUrl = (environment.network === 'testnet')
      ? 'https://testnet-dex.binance.org/api/v1'
      : 'https://dex.binance.org/api/v1';

  }

  getBinanceFees(): Observable<Fees> {
    return this.http.get<Fees>(`${this.baseUrl}/fees`);
  }

  getTransferFees(feesData: Fees) {


    const fees = this.getTransferFeeds(feesData);
    if (fees) {
      console.log('transfer feeds 1234567: ', fees);
      return fees;
    } else {
      return null;
    }


    // yield takeEvery('GET_BINANCE_FEES', function*({
    //   net,
    // }: ReturnType<typeof actions.getBinanceFees>) {
    //   try {
    //     // const data = yield call(tryGetBinanceFees, net);
    //     // parse fees
    //     const fees = getTransferFeeds(data);
    //     const result = fees
    //       ? success(fees)
    //       : failure(new Error(`No feeds for transfers defined in ${data}`));
    //     yield put(actions.getBinanceTransferFeesResult(result));
    //   } catch (error) {
    //     yield put(actions.getBinanceTransferFeesResult(failure(error)));
    //   }
    // });
  }

  /**
   * Type guard for runtime checks of `Fee`
   */
  isFee(v: Fee | TransferFee | DexFees): v is Fee {
    return !!(v as Fee)?.msg_type &&
    (v as Fee)?.fee !== undefined &&
    (v as Fee)?.fee_for !== undefined;
  }

  /**
   * Type guard for `TransferFee`
   */
  isTransferFee(v: Fee | TransferFee | DexFees): v is TransferFee {
    return this.isFee((v as TransferFee)?.fixed_fee_params) &&
    !!(v as TransferFee)?.multi_transfer_fee;
  }



  getTransferFeeds(fees: Fees): TransferFees {
    return fees.reduce((acc: TransferFees, dataItem) => {
      if (!acc && this.isTransferFee(dataItem)) {
        const single = dataItem.fixed_fee_params.fee;
        const multi = dataItem.multi_transfer_fee;
        if (single && multi) {
          return { single: baseAmount(single), multi: baseAmount(multi) } as TransferFees;
        }
        return null;
      }
      return acc;
    }, null);
  }

}

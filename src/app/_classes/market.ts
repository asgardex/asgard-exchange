

export interface MarketResponse {
  status: number;
  result: MarketDTO[];
}

export interface MarketDTO {
  base_asset_symbol: string;
  list_price: string;
  lot_size: string;
  quote_asset_symbol: string;
  tick_size: string;
}

export class Market {
  baseAssetSymbol: string;
  listPrice: number;
  lotSize: number;
  quoteAssetSymbol: string;
  tickSize: number;

  constructor(marketDTO: MarketDTO) {
    this.baseAssetSymbol = marketDTO.base_asset_symbol;
    this.listPrice = Number(marketDTO.list_price);
    this.lotSize = Number(marketDTO.lot_size);
    this.quoteAssetSymbol = marketDTO.quote_asset_symbol;
    this.tickSize = Number(marketDTO.tick_size);
  }

}



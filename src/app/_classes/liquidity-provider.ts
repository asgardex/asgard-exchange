export interface LiquidityProvider {
  asset: string;
  rune_address: string;
  asset_address: string;
  last_add_height: number;
  units: string;
  pending_rune: string;
  pending_asset: string;
  pending_tx_Id: string;
  rune_deposit_value: string;
  asset_deposit_value: string;
}

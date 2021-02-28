export interface PoolAddressDTO {
  chain: string;
  pub_key: string;
  address: string;
  router: string;
  halted: boolean;
}

export class PoolAddress {
  chain: string;
  pubKey: string;
  address: string;
  router: string;
  halted: boolean;

  constructor(dto: PoolAddressDTO) {
    this.chain = dto.chain;
    this.pubKey = dto.pub_key;
    this.address = dto.address;
    this.halted = dto.halted;
    this.router = dto.router;
  }

}

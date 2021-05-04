export interface MemberPool {
  pool: string;
  assetAdded: string;
  assetAddress: string;
  assetWithdrawn: string;
  dateFirstAdded: string;
  dateLastAdded: string;
  liquidityUnits: string;
  runeAddress: string;
  runeAdded: string;
  runeWithdrawn: string;
}

export interface MemberDTO {
  pools: MemberPool[];
}

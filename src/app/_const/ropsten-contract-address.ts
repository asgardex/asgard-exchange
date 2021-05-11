import { environment } from 'src/environments/environment';

export const thorchainContractAddress =
  environment.network === 'testnet'
    ? '0x9d496De78837f5a2bA64Cb40E62c19FBcB67f55a'
    : '';

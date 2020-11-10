// this is overwritten on build
// in scripts/setenv

export const environment = {
  production: false,
  network: 'testnet',
  blockchairKey: process.env.BLOCKCHAIR_KEY
};

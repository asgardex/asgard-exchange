// this is overwritten on build
// in scripts/setenv

export const environment = {
  production: true,
  network: 'chaosnet',
  etherscanKey: process.env.ETHERSCAN_KEY,
  infuraProjectId: process.env.INFURA_PROJET_ID
};

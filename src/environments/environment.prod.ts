// this is overwritten on build
// in scripts/setenv

export const environment = {
  production: true,
  network: 'chaosnet',
  blockchairKey: process.env.BLOCKCHAIR_KEY
};

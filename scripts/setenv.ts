const { writeFile } = require('fs');
const { argv } = require('yargs');
// read environment variables from .env file
require('dotenv').config();
// read the command line arguments passed with yargs
const environment = argv.environment;
const configuration = argv.configuration;

const isProduction = environment === 'prod';
const isTestnet = configuration === 'testnet';

let targetPath;

if (isTestnet) {

  if (isProduction) {
    targetPath = `./src/environments/environment.testnet.ts`; // testnet prod
  } else {
    targetPath = `./src/environments/environment.ts`; // testnet dev
  }

} else {

  if (isProduction) {
    targetPath = `./src/environments/environment.prod.ts`; // mainnet prod
  } else {
    targetPath = `./src/environments/environment.ts`; // mainnet dev
  }

}

// we have access to our environment variables
// in the process.env object thanks to dotenv
const environmentFileContent = `
export const environment = {
   production: ${isProduction},
   network: '${isTestnet ? 'testnet' : 'chaosnet'}',
   etherscanKey: '${process.env.ETHERSCAN_KEY}',
   infuraProjectId: '${process.env.INFURA_PROJECT_ID}',
};
`;
// write the content to the respective file
writeFile(targetPath, environmentFileContent, (err) => {
   if (err) {
      console.log(err);
   }
   console.log(`Wrote variables to ${targetPath}`);
});

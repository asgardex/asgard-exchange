if [ "$NODE_ENV" == "production" ]
then
  npm i -g serve && npm run build
else
  npm i -g serve && npm run build:testnet
fi

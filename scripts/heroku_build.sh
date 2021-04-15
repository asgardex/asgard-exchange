if [ "$NODE_ENV" == "production" ]
  npm i -g serve && npm run build
else
  npm i -g serve && npm run build:testnet
fi

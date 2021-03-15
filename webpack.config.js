const { addTailwindPlugin } = require("@ngneat/tailwind");
const tailwindConfig = require("./tailwind.config.js");

module.exports = (config) => {
  addTailwindPlugin({
    webpackConfig: config,
    tailwindConfig,
    patchComponentsStyles: true
  });

  // For using crypto in browser
  config.resolve.alias = {
    "crypto": "crypto-browserify"
  };
  config.node = {
    vm: true,
    stream: true
  };
  return config
};


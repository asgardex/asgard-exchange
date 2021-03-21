const { addTailwindPlugin } = require("@ngneat/tailwind");
const tailwindConfig = require("./tailwind.config.js");
const TerserPlugin = require('terser-webpack-plugin')

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

  // taken from https://github.com/thorchain/asgardex-electron/pull/1039
  // to resolve BCH error on transfer only for builds
  config.optimization.minimizer = [
    // TerserPlugin
    // https://webpack.js.org/plugins/terser-webpack-plugin/#exclude
    //
    // Note: Most options are copied from original CRA settings
    // see https://github.com/facebook/create-react-app/blob/18b5962ff82a50e01a42c502c6be2d8878e61633/packages/react-scripts/config/webpack.config.js#L246-L285
    new TerserPlugin({
      // Terser minify options.
      // https://github.com/webpack-contrib/terser-webpack-plugin/#terseroptions
      terserOptions: {
        parse: {
          // We want terser to parse ecma 8 code. However, we don't want it
          // to apply any minification steps that turns valid ecma 5 code
          // into invalid ecma 5 code. This is why the 'compress' and 'output'
          // sections only apply transformations that are ecma 5 safe
          // https://github.com/facebook/create-react-app/pull/4234
          ecma: 8
        },
        compress: {
          ecma: 5,
          warnings: false,
          // Disabled because of an issue with Uglify breaking seemingly valid code:
          // https://github.com/facebook/create-react-app/issues/2376
          // Pending further investigation:
          // https://github.com/mishoo/UglifyJS2/issues/2011
          comparisons: false,
          // Disabled because of an issue with Terser breaking valid code:
          // https://github.com/facebook/create-react-app/issues/5250
          // Pending further investigation:
          // https://github.com/terser-js/terser/issues/120
          inline: 2
        },
        // mangle: { // not needed for ASGDX
        //  safari10: true // not needed for ASGDX
        // },
        // Added for profiling in devtools
        // keep_classnames: isEnvProductionProfile, // not needed for ASGDX
        // keep_fnames: isEnvProductionProfile, // not needed for ASGDX
        output: {
          ecma: 5,
          comments: false,
          // Turned on because emoji and regex is not minified properly using default
          // https://github.com/facebook/create-react-app/issues/2488
          ascii_only: true
        },
        // mangle options
        // https://github.com/terser/terser#mangle-options
        mangle: {
          // To fix "Expected property "1" of type BigInteger, got n" issue while sending BCH txs
          // Solution based on: https://github.com/bitcoinjs/bitcoinjs-lib/issues/959#issuecomment-351040758
          reserved: ['Buffer', 'BigInteger', 'Point', 'ECPubKey', 'ECKey', 'sha512_asm', 'asm', 'ECPair', 'HDNode']
        }
      }
    })
  ]

  return config
};


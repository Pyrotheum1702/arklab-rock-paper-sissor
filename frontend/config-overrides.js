const webpack = require('webpack');

module.exports = function override(config) {
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve('crypto-browserify'),
    stream: require.resolve('stream-browserify'),
    assert: require.resolve('assert'),
    http: require.resolve('stream-http'),
    https: require.resolve('https-browserify'),
    os: require.resolve('os-browserify'),
    url: require.resolve('url'),
    buffer: require.resolve('buffer'),
    process: require.resolve('process/browser'),
  });
  config.resolve.fallback = fallback;

  // Add alias for process/browser to fix ESM resolution
  config.resolve.alias = {
    ...(config.resolve.alias || {}),
    'process/browser': require.resolve('process/browser'),
    'openapi-fetch': require.resolve('./src/mocks/openapi-fetch.js'),
  };

  // Fix for ESM module resolution
  config.resolve.extensions = [...(config.resolve.extensions || []), '.ts', '.tsx', '.js', '.jsx'];
  config.resolve.fullySpecified = false;

  config.plugins = (config.plugins || []).concat([
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.NormalModuleReplacementPlugin(
      /openapi-fetch/,
      require.resolve('./src/mocks/openapi-fetch.js')
    ),
  ]);

  config.ignoreWarnings = [/Failed to parse source map/];

  return config;
};

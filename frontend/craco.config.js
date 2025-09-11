module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress source map warnings for problematic packages
      webpackConfig.module.rules.push({
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/@reown/,
          /node_modules\/@base-org/,
          /node_modules\/@coinbase/,
          /node_modules\/superstruct/
        ]
      });
      
      // Also disable source map warnings globally
      webpackConfig.ignoreWarnings = [
        /Failed to parse source map/,
        /ENOENT: no such file or directory/
      ];
      
      return webpackConfig;
    }
  }
};

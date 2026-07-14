var path = require('path');

module.exports = {
    mode: 'production',
    entry: './src/jwplayer.jsx',
    output: {
        path: path.resolve('lib'),
        filename: 'jwplayer-react.js',
        libraryTarget: 'commonjs2'
    },
    externals: {
        'react': 'commonjs2 react',
        'react/jsx-runtime': 'commonjs2 react/jsx-runtime',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    }
}
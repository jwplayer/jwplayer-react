var path = require('path');
var pkg = require('./package.json');
module.exports = {
    mode: 'production',
    entry: pkg.main,
    output: {
        path: path.resolve('lib'),
        filename: 'jwplayer-react.js',
        libraryTarget: 'commonjs2'
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
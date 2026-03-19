var path = require('path');

module.exports = {
    mode: 'development',
    entry: './demo/app.jsx',
    output: {
        path: path.resolve('demo'),
        filename: 'bundle.js',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: 'babel-loader',
            },
        ],
    },
    resolve: {
        extensions: ['.js', '.jsx'],
    },
};

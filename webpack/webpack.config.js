const path = require('path');

module.exports =
{
    "mode": "development",
    "entry": __dirname+"/../index",
    "output": {
        "path": __dirname+'/../build',
        /*"filename": "[name].[chunkhash:8].js"*/
        "filename": "annulus.min.js",
        "library": ['annulus'],
        "libraryTarget": 'var'
    },
    "devtool": "source-map",
    "module": {
        "rules": [
            {
                "enforce": "pre",
                "test": /\.(js|jsx)$/,
                "exclude": /node_modules/,
                "use": "eslint-loader"
            },
            {
                "test": /\.js$/,
                "exclude": /node_modules/,
                "use": {
                    "loader": "babel-loader"/*,
                    "options": {
                        "presets": [
                            "env"
                        ]
                    }*/
                }
            },
            {
                "test": /\.scss$/,
                "use": [
                    "style-loader",
                    "css-loader",
                    "sass-loader"
                ]
            },
            {
                "test": /\.css$/,
                "use": [
                    "style-loader",
                    "css-loader",
                ]
            }
        ]
    }
}

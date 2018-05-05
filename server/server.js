const bodyParser            = require('body-parser');
const express               = require('express');
const historyApiFallback    = require('connect-history-api-fallback');
const mongoose              = require('mongoose');
const flash                 = require('connect-flash');
const session               = require('express-session')
const app                   = express();

const fs                    = require('fs');
const path                  = require('path');

const webpack               = require('webpack');
const webpackDevMiddleware  = require('webpack-dev-middleware');
const webpackHotMiddleware  = require('webpack-hot-middleware');
const morgan                = require('morgan');

const passport              = require('passport');
const LocalStrategy         = require('passport-local').Strategy;

const config                = require('../config/config');
const webpackConfig         = require('../webpack.config');

const isDev                 = process.env.NODE_ENV !== 'production';
const port                  = process.env.PORT || 8080;


// Configuration
// ================================================================================================

// Set up Mongoose
mongoose.connect(isDev ? config.db_dev : config.db, {
  useMongoClient: true,
});
mongoose.Promise = global.Promise;

// Initialize modules
app.use(express.static('public'))
app.use(session({
  secret: config.secret_key,
  resave: false,
  saveUninitialized: false,
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash()); 

// Files required
require('../auth/passport-init')(passport);
require('./routes')(app);


if (isDev) {
  const compiler = webpack(webpackConfig);

  app.use(morgan('dev'));
  app.use(historyApiFallback({
    verbose: false
  }));

  app.use(webpackDevMiddleware(compiler, {
    publicPath: webpackConfig.output.publicPath,
    contentBase: path.resolve(__dirname, '../client/public'),
    stats: {
      colors: true,
      hash: false,
      timings: true,
      chunks: false,
      chunkModules: false,
      modules: false
    }
  }));

  app.use(webpackHotMiddleware(compiler));
  app.use(express.static(path.resolve(__dirname, '../dist')));
} else {
  app.use(express.static(path.resolve(__dirname, '../dist')));
  app.get('*', function (req, res) {
    res.sendFile(path.resolve(__dirname, '../dist/index.html'));
    res.end();
  });
}

app.listen(port, '0.0.0.0', (err) => {
  if (err) {
    console.log(err);
  }

  console.info('>>> 🌎 Open http://0.0.0.0:%s/ in your browser.', port);
});

module.exports = app;
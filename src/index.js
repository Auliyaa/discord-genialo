const _configparser = require('configparser');
const _genialo      = require('./genialo');

// handlers
const _player       = require('./player/player');
const _gamedeals    = require('./gamedeals/gamedeals');
const _pledges      = require('./eso/pledges');
const _reactpic      = require('./reaction/reactpic');

async function __main__()
{
  // parse configuration
  console.log(`.. reading configuration from ${process.argv[2]}`);
  const config = new _configparser();
  config.read(process.argv[2]);

  // create the client & connect to discord
  const bot = new _genialo.genialo(config);
  await bot.connect();

  _player.register(bot);
  _gamedeals.register(bot);
  _pledges.register(bot);
  _reactpic.register(bot);
}

__main__();

const _configparser = require('configparser');
const _genialo      = require('./genialo');

// handlers
const _player       = require('./player/player');
const _gamedeals    = require('./gamedeals/gamedeals');
const _pledges      = require('./eso/pledges');

async function __main__()
{
  // parse configuration
  const config = new _configparser();

  if (process.argv.length >= 3)
  {
    console.log(`.. reading configuration from ${process.argv[2]}`);
    config.read(process.argv[2]);
  }
  else
  {
    console.log(`.. reading configuration from /etc/genialo.conf`);
    config.read("/etc/genialo.conf");
  }

  // create the client & connect to discord
  const bot = new _genialo.genialo(config);
  await bot.connect();

  _player.register(bot);
  _gamedeals.register(bot);
  _pledges.register(bot);
}

__main__();

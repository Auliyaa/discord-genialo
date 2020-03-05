const _configparser = require('configparser');
const _genialo      = require('./genialo');
const ytdl          = require('ytdl-core');

async function __main__()
{
  // parse configuration
  const config = new _configparser();

  if (process.argv.length >= 3)
  {
    config.read(process.argv[2]);
  }
  else
  {
    config.read("/etc/genialo.conf");
  }

  // create the client & connect to discord
  const bot = new _genialo.genialo(config);
  await bot.connect();
}

__main__();

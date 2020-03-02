const discord = require('discord.js');
const cfg_parser = require('configparser')

// ====================================
// parse configuration
// ====================================
const config = new cfg_parser();
config.read(process.argv[2]);

// ====================================
// create the main discord client handle
// ====================================
const client = new discord.Client();

// ====================================
// insert our state machine object
// ====================================
client.genialo = {};

// ====================================
// register command handlers & forward configuration
// ====================================
client.genialo.handlers = [
  new (require("./handlers/play").play)(config)
];

console.log("registered handlers:")
for (var hdl of client.genialo.handlers)
{
  console.log(` - ${hdl.id}`)
}

// ====================================
// register events
// ====================================
// "ready": triggered once the client is connected to discord servers
client.on('ready', () =>
{
  client.genialo.ready = true;
});

// "message": triggered when a new message has been sent to one of the visible channels.
client.on('message', (msg) =>
{
  for (let hdl of msg.client.genialo.handlers)
  {
    if (hdl.handle(msg))
    {
      console.log(`$ Command: "${msg.content}" handled by ${hdl.id}`);
      return;
    }
  }
});

// ====================================
// connect to discord using the bot's oauth token
// ====================================
client.login(config.get('discord', 'token'));

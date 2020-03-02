const discord = require('discord.js');

// ====================================
// create the main discord client handle
// ====================================
const client = new discord.Client();

// ====================================
// insert our state machine object
// ====================================
client.genialo = {};

// ====================================
// register command handlers
// ====================================
client.genialo.handlers = [
  new (require("./handlers/play").play)()
];

console.log("registered handlers:")
for (var hdl of client.genialo.handlers)
{
  console.log(` ${hdl.id}`)
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
      console.log(`${msg.content} handled by ${hdl.id}`);
      return;
    }
  }
});

// ====================================
// connect to discord using the bot's oauth token
// ====================================
// client.login('NjU5MDcyMDc4MDc4ODA0MDA5.XlwXZw.oOU_ks7e3yvsYwdJkcLr7DSE19E');

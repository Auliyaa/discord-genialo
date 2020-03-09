const discord = require('discord.js');
const voice   = require('./genialo_voice');

/// main class for our bot
class genialo
{
  constructor(config)
  {
    this.config = config;
    this.client = new discord.Client();

    this.handlers = {};
    // internal handler data segment.
    this.hdata = {};

    this.voice = new voice.genialo_voice(this);
  }

  /// connect using the token provided in the configuration
  connect()
  {
    return new Promise(resolve => {
      this.client.on('ready', () =>
      {
        resolve('ok');
      });
      this.client.login(this.config.get('discord', 'token'));
    });
  }

  disconnect()
  {
    // TODO
  }

  /// add a handler callback for a given event from the client
  register(event_id, handler_id, callback)
  {
    if (!(event_id in this.handlers))
    {
      // no callback was registered for this event id, update client callbacks
      this.handlers[event_id] = [];
      this.client.on(event_id, ((...args) => {
        for (let h of this.handlers[event_id])
        {
          let restrict_channel = this.config.get(`restrict-${event_id}`, h.id);
          if (restrict_channel)
          {
            for (let arg of args)
            {
              if (arg.channel && arg.channel.id != restrict_channel)
              {
                return;
              }
            }
          }
          h.cb(args);
        }
      }).bind(this));
    }
    if (this.handlers[event_id].find(e => e.id == handler_id))
    {
      // handler id already registered: skipping
      throw `${handler_id} already registered for event ${event_id}`
    }

    this.handlers[event_id].push({
      id: handler_id,
      cb: callback
    });
  }

  unregister(event_id, handler_id)
  {
    if (event_id in this.handlers)
    {
      this.handlers[event_id] = this.handlers[event_id].filter(e => e.id != handler_id);
    }
  }

  /// list all channels in a given user is currently in
  list_channels(user)
  {
    let result = []
    for (let guild of this.client.guilds.cache)
    {
      for (let channel of guild[1].channels.cache)
      {
        for (let member of channel[1].members)
        {
          if (member[1].id == user.id)
          {
            result.push(channel[1]);
          }
        }
      }
    }
    return result;
  }

  /// return the voice channel a given user is connected to,
  ///  or undefined if this user is not connected to voice
  voice_channel(user)
  {
    let voice_channel = null;
    return this.list_channels(user).find(ch => ch.type == 'voice');
  }
}

module.exports.genialo = genialo;

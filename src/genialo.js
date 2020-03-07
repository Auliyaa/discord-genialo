const discord = require('discord.js');

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

    this.voice = {
      genialo   : this,
      connection: null,
      channel   : null,
      dispatcher: null,
      volume    : 1,
      queue     : [],

      async connect(target)
      {
        return new Promise(async resolve => {
          this.stop();
          this.channel    = target;
          this.connection = await this.channel.join();
          this.genialo.voice_play('./samples/join.mp3', () => { resolve(); });
        });
      },

      disconnect()
      {
        this.stop();
        if (this.connection != null)
        {
          this.connection.disconnect();
          this.connection = null;
        }
        this.channel = null;
      },

      stop()
      {
        if (this.dispatcher != null)
        {
          this.dispatcher.destroy();
          this.dispatcher = null;
        }
      }
    };
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

  /// change volume for all voice actions
  set volume(vol)
  {
    this.voice.volume = vol;
    if (this.voice.dispatcher != null)
    {
      this.voice.dispatcher.setVolume(this.voice.volume);
    }
  }
  get volume()
  {
    return this.voice.volume;
  }

  /// true when an audio stream is currently being dispatched
  get playing()
  {
    return this.voice.dispatcher != null;
  }

  /// true when developer mode is enabled in the configuration
  get developer()
  {
    return this.config.get('genialo', 'developer') == 'true';
  }

  /// queue an audio stream to be played in a specific target
  push_audio(target_channel, audio, on_start, on_finish)
  {
    this.voice.queue.push({
      target: target_channel,
      audio : audio,
      callbacks: {
        start : on_start,
        finish: on_finish
      }
    });

    if (!this.playing)
    {
      this.next_audio();
    }

    return this.voice.queue.length;
  }

  /// plays the next audio in queue
  async next_audio()
  {
    if (this.voice.queue.length == 0)
    {
      // queue is now empty: disconnect from audio
      this.voice.disconnect();
      return;
    }

    // fetch next entry in queue
    let entry = this.voice.queue.shift();

    if (this.voice.channel != null && entry.target.id != this.voice.channel.id)
    {
      // current voice channel is not the entry's target: disconnect from current voice channel
      this.voice.disconnect();
    }

    // stop any previous playback
    this.voice.stop();

    if (this.voice.channel == null)
    {
      // connect to the target voice channel
      await this.voice.connect(entry.target);
    }

    // trigger user callback
    if (entry.callbacks.start)
    {
      entry.callbacks.start();
    }

    // start playback
    this.voice_play(entry.audio(), () =>
    {
      if (entry.callbacks.finish)
      {
        entry.callbacks.finish();
      }
      this.next_audio();
    });
  }

  voice_play(audio, on_finish)
  {
    // forward to dispatcher
    this.voice.dispatcher = this.voice.connection.play(audio, { volume: this.voice.volume });
    this.voice.dispatcher.on('finish', on_finish);
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

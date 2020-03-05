const discord = require('discord.js');

/// main class for our bot
class genialo
{
  constructor(config)
  {
    this.config = config;
    this.client = new discord.Client();

    this.voice = {
      connection: null,
      channel   : null,
      dispatcher: null,
      volume    : 1,
      queue     : [],

      async connect(target)
      {
        if (this.dispatcher != null)
        {
          this.dispatcher.destroy();
          this.dispatcher = null;
        }
        this.channel    = target;
        this.connection = await this.channel.join();
      },

      disconnect()
      {
        if (this.connection != null)
        {
          this.connection.disconnect();
          this.connection = null;
        }
        if (this.dispatcher != null)
        {
          this.dispatcher.destroy();
          this.dispatcher = null;
        }
        this.channel = null;
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

  /// queue an audio stream to be played in a specific target
  queue(target_channel, audio, on_start, on_finish)
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
      this.queue_next();
    }
  }

  /// plays the next audio in queue
  async queue_next()
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

    // connect to the target voice channel
    await this.voice.connect(entry.target);

    // trigger user callback
    if (entry.callbacks.start)
    {
      entry.callbacks.start();
    }

    // start playback
    this.voice.dispatcher = this.voice.connection.play(entry.audio, { volume: this.voice.volume });
    // register callbacks
    this.voice.dispatcher.on('finish', () =>
    {
      if (entry.callbacks.finish)
      {
        entry.callbacks.finish();
      }
      this.queue_next();
    });
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

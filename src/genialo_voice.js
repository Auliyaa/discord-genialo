/// handle a global audio queue for the genialo bot
class genialo_voice
{
  constructor(genialo)
  {
    this.genialo    = genialo;
    this.connection = null;
    this.channel    = null;
    this.dispatcher = null;
    this.volume_v   = 1;
    this.queue      = [];
    this.current    = null;
  }

  async connect(target)
  {
    this.stop();
    this.channel    = target;
    this.connection = await this.channel.join();
  }

  disconnect()
  {
    this.stop();
    if (this.connection != null)
    {
      this.connection.disconnect();
      this.connection = null;
    }
    this.channel = null;
  }

  stop()
  {
    if (this.dispatcher != null)
    {
      this.dispatcher.destroy();
      this.dispatcher = null;
    }
  }

  play(audio, on_finish)
  {
    // forward to dispatcher
    this.dispatcher = this.connection.play(audio, { volume: this.volume });
    this.dispatcher.on('finish', on_finish);
  }

  /// change volume for all voice actions
  set volume(vol)
  {
    this.volume_v = vol;
    if (this.dispatcher != null)
    {
      this.dispatcher.setVolume(this.volume_v);
    }
  }
  get volume()
  {
    return this.volume_v;
  }

  /// true when an audio stream is currently being dispatched
  get playing()
  {
    return this.current != null;
  }

  /// queue an audio stream to be played in a specific target
  push(target_channel, name, audio, on_start, on_finish)
  {
    this.queue.push({
      name  : name,
      target: target_channel,
      audio : audio,
      callbacks: {
        start : on_start,
        finish: on_finish
      }
    });

    if (!this.playing)
    {
      this.next();
      return 0;
    }

    return this.queue.length;
  }

  /// plays the next audio in queue
  async next()
  {
    if (this.queue.length == 0)
    {
      // queue is now empty: disconnect from audio
      this.disconnect();
      return;
    }

    // fetch next entry in queue
    this.current = this.queue.shift();

    if (this.channel != null && this.current.target.id != this.channel.id)
    {
      // current voice channel is not the current target: disconnect from current voice channel
      this.disconnect();
    }

    // stop any previous playback
    this.stop();

    if (this.channel == null)
    {
      // connect to the target voice channel
      await this.connect(this.current.target);
    }

    // trigger user callback
    if (this.current.callbacks.start)
    {
      this.current.callbacks.start();
    }

    // start playback
    this.play(this.current.audio(), () =>
    {
      if (this.current.callbacks.finish)
      {
        this.current.callbacks.finish();
      }
      this.next();
    });
  }
}

module.exports.genialo_voice = genialo_voice;

const d = require('../discord-utils')
const ytdl = require('ytdl-core');

/// plays a sequence of songs in a row
/// see https://discord.js.org/#/docs/main/stable/topics/voice for implementation details
class music_queue
{
  constructor(cfg)
  {
    this._text_channel = null;
    this._cfg = cfg;
    this._entries = [];
    this._cx = null;
    this._dispatcher = null;
    this._volume = 1;
  }

  /// append a new entry to the current queue
  /// play it immediately if the queue was empty
  append(entry)
  {
    this._entries.push(entry);
    if (!this.playing)
    {
      this.next();
    }
    else
    {
      entry.channel.send(`:clock1: Your song is now in queue at position **#${this._entries.length}** :clock1:`);
    }
  }

  /// plays the next song in the queue, switch channel if needed
  async next()
  {
    // stop the current song if it was already playing
    if (this.playing)
    {
      this._dispatcher.destroy();
      this._dispatcher = null;
    }

    if (this._entries.length == 0)
    {
      // no more song to play: stop there
      return null;
    }

    let current = this._entries.shift();

    // locate target
    let voice_channel = d.voice_channel(current.channel.guild, current.user);
    if (voice_channel == null && this._cx == null)
    {
      // target user is not in a voice channel and no previous connection is available.
      // skip song
      // TODO: need to handle this case in a better way
      this.next();
      return;
    }
    else if (voice_channel != null)
    {
      if (this._cx != null && this._cx.channel.id != voice_channel.id)
      {
        // target is located in a different voice channel: redo connection
        this._cx.disconnect();
      }

      // play the actual song
      this._cx = await voice_channel.join();
    }

    // playback requested song
    current.channel.send(`:headphones: Now playing **${current.url}** :headphones:`);
    this._dispatcher = this._cx.play(ytdl(current.url, {filter: 'audioonly'}), { volume: this._volume });

    // when the song ends: skip to the next song, if available.
    this._dispatcher.on("finish",() => {
      this.next();
    });
  }

  /// changes the volume of the current & next songs
  set volume(volume)
  {
    this._volume = volume;
    if (this._dispatcher != null)
    {
      this._dispatcher.setVolume(this._volume);
    }
  }

  get volume()
  {
    return this._volume;
  }

  /// returns true if this queue is currently playing a song
  get playing()
  {
    return this._dispatcher != null;
  }

  /// return the title of each entry in the current queue
  get entries()
  {
    let result = []
    for (let e of this._entries)
    {
      result.push(e.title)
    }
    return result
  }
  
}

module.exports.music_queue = music_queue;

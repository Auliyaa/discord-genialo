const ytsc = require('youtube-search');
const d    = require('./discord-utils')

/// main handler for music-related commands
class player
{
  constructor(cfg)
  {
    this._cfg = cfg;
    this._ytsc = {};
    this._ytsc.opts = {
      maxResults: 5,
      key: cfg.get('youtube','token')
    };
    this._current_search = null;
    this._queue = new (require("./music/queue").music_queue)(cfg);
    this._troll = false;
  }

  get id() {
    return '!play';
  }

  /// look for a given search string and cache the first n results inside _current_search
  play(search_string, message, quiet, on_end)
  {
    console.log(`$ play(${search_string}, ${quiet})`);

    if (d.voice_channel(message.channel.guild, message.author) == null)
    {
      message.reply("you need to be in a voice channel. :warning:");
      return;
    }

    // reset the previous search
    this._current_search = null;

    ytsc(search_string, this._ytsc.opts, (err, results) => {
      if (results.length == 0)
      {
        message.reply(`no match found for: ${search_string}`);
        return;
      }
      else
      {
        // build search cache
        this._current_search = {
          message      : message,
          results      : [],
          result_titles: []
        };
        for (let ii=0; ii < results.length; ++ii) {
          this._current_search.results.push(results[ii].link);
          this._current_search.result_titles.push(results[ii].title);
        }
        console.log(`$ play results: ${this._current_search.results}`);

        if (!quiet)
        {
          // reply with all available results
          let reply_data = `here are the ${this._ytsc.opts.maxResults} top results for your search: **${search_string}** :musical_note:\n`
          reply_data += `\n`
          for (let ii=0; ii < this._current_search.result_titles.length; ++ii)
          {
            reply_data += ` ${ii+1}) ${this._current_search.result_titles[ii]}\n`
          }
          reply_data += `\n`
          reply_data += `Please type-in *!choose <1-${results.length}>* to play/queue the selected track.\n`

          message.reply(reply_data);
        }

        if (on_end != undefined)
        {
          on_end();
        }
      }
    });
  }

  /// choose a result to play within the _current_search array
  choose(idx, message)
  {
    console.log(`$ choose(${idx})`);
    if (this._current_search == null)
    {
      console.log("$ no _current_search: aborting");
      return;
    }

    if (idx >= this._current_search.results.length)
    {
      this._current_search.message.reply(`please type-in *!choose <1-${this._current_search.results.length}>* to play/queue the selected track.\n`);
    }
    else
    {
      // setup the next music queue entry
      this._queue.append({
        url    : this._current_search.results[idx],
        title  : this._current_search.result_titles[idx],
        channel: this._current_search.message.channel,
        user   : this._current_search.message.author
      });

      // clear current search
      this._current_search = null;
    }
  }

  /// global callback when a message comes-in
  handle_msg(message)
  {
    // !playc look for the requested music over on youtube
    // fill-out this._current_search with the resulting videos and wait for the next !choose command
    if (message.content.startsWith('!playc '))
    {
      let args = message.content.replace('!playc ', '');
      if (args.length == 0)
      {
        return true;
      }
      this.play(args, message, false);
      return true;
    }

    /// shortcut for !playc that skips to the first result and pqueue it immediately
    if (message.content.startsWith('!play '))
    {
      let args = message.content.replace('!play ', '');
      if (args.length == 0)
      {
        return true;
      }
      this.play(args, message, true, () => {
        this.choose(0, message);
      });
      return true;
    }

    /// !choose: Choose from one of the proposed songs after a !play command
    else if (message.content.startsWith('!choose ') && this._current_search != null)
    {
      let args = message.content.replace('!choose ','').split(' ');
      if (args.length != 1 ||
          isNaN(parseInt(args[0])))
      {
        return true;
      }

      this.choose(parseInt(args[0])-1, message);

      return true;
    }

    /// !queue: print-out the current queue
    else if (message.content.startsWith('!queue'))
    {
      if (this._queue.entries.length == 0)
      {
        message.reply("Current music queue is empty :wind_blowing_face: :wind_blowing_face: :wind_blowing_face:");
        return true;
      }

      let s = "Current play queue:\n"
      for (let e of this._queue.entries)
      {
        s += `:small_blue_diamond: ${e}\n`
      }
      message.reply(s);

      return true;
    }

    /// !skip: Skip to the next song in queue
    else if (message.content.startsWith('!skip'))
    {
      message.reply(`Skipping to next song.`);
      this._queue.next();

      return true;
    }

    /// !stop: Clears the queue & stop the current song.
    else if (message.content.startsWith('!stop'))
    {
      message.reply(":octagonal_sign: Stopping :octagonal_sign:");
      this._queue._entries = [];
      this._queue.next();

      return true;
    }

    /// !volume <0-100>
    else if (message.content.startsWith('!volume'))
    {
      //parse command argument
      let args = message.content.replace('!volume ','').split(' ');
      if (args.length != 1 ||
          isNaN(parseInt(args[0])) ||
          parseInt(args[0]) < 0 ||
          parseInt(args[0]) > 100)
      {
        message.reply(`please type-in *!volume <0-100>* to change the volume.\n`);
      }
      else
      {
        message.reply(`Volume set to **${args[0]}**.\n`);
        this._queue.volume = parseInt(args[0]) / 100.;
      }
      return true;
    }

    /// !troll: Toggle troll mode
    else if (message.content.startsWith('!troll'))
    {
      this._troll = !this._troll;
      return false;
    }

    return false;
  }

}

module.exports.player = player;

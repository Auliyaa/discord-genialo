const ytsc = require('youtube-search');
const d    = require('./discord-utils')

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
    this._current_search = {
      message: null,
      results: []
    };
    this._queue = new (require("./music/queue").music_queue)(cfg);
    this._troll = false;
  }

  get id() {
    return '!play';
  }

  handle_msg(message)
  {
    // !play: look for the requested music over on youtube
    // fill-out this._current_search with the resulting videos
    if (message.content.startsWith('!play '))
    {
      if (d.voice_channel(message.channel.guild, message.author) == null)
      {
        message.reply("you need to be in a voice channel. :warning:");
        return true;
      }

      let search_term = message.content.replace('!play ','');
      ytsc(search_term, this._ytsc.opts, (err, results) => {
        if (results.length == 0)
        {
          message.reply(`no match found for: ${search_term}`);
          this._current_search = null;
        }
        else
        {
          this._current_search = {
            message: message,
            results: []
          };

          let reply_data = `here are the ${this._ytsc.opts.maxResults} top results for your search: **${search_term}** :musical_note:\n`
          reply_data += `\n`

          for (let ii=0; ii < results.length; ++ii) {
            reply_data += ` ${ii+1}) ${results[ii].title}\n`
            this._current_search.results.push(results[ii].link);
          }

          reply_data += `\n`
          reply_data += `Please type-in *!choose <1-${results.length}>* to play/queue the selected track.\n`

          message.reply(reply_data);
        }
      });
      return true;
    }

    /// !choose: Choose from one of the proposed songs after a !play command
    else if (message.content.startsWith('!choose ') && this._current_search != null)
    {
      let choose_term = message.content.replace('!choose ','').split(' ');
      if (choose_term.length != 1 ||
          isNaN(parseInt(choose_term[0])) ||
          parseInt(choose_term[0]) > this._current_search.results.length)
      {
        this._current_search.message.reply(`please type-in *!choose <1-${this._current_search.results.length}>* to play/queue the selected track.\n`);
      }
      else
      {
        // setup the next music queue entry
        this._queue.append({
          url    : this._current_search.results[parseInt(choose_term[0])-1],
          channel: this._current_search.message.channel,
          user   : this._current_search.message.author
        });

        // clear current search
        this._current_search = null;
      }


      return true;
    }

    /// !skip: Skip to the next song in queue
    else if (message.content.startsWith('!skip'))
    {
      message.reply(`Skipping to next song.`);
      this._queue.next();
    }

    /// !stop: Clears the queue & stop the current song.
    else if (message.content.startsWith('!stop'))
    {
      message.reply(":octagonal_sign: Stopping :octagonal_sign:");
      this._queue._entries = [];
      this._queue.next();
    }

    /// !volume <0-100>
    else if (message.content.startsWith('!volume'))
    {
      let choose_term = message.content.replace('!volume ','').split(' ');
      if (choose_term.length != 1 ||
          isNaN(parseInt(choose_term[0])) ||
          parseInt(choose_term[0]) < 0 ||
          parseInt(choose_term[0]) > 100)
      {
        message.reply(`please type-in *!volume <0-100>* to change the volume.\n`);
      }
      else
      {
        message.reply(`Volume set to **${choose_term[0]}**.\n`);
        this._queue.volume = parseInt(choose_term[0]) / 100.;
      }
      return true;
    }

    else if (message.content.startsWith('!troll'))
    {
      this._troll = !this._troll;
      return false;
    }

    return false;
  }

}

module.exports.player = player;

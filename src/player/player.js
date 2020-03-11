const _ytsc = require('yt-search');
const _ytdl = require('ytdl-core');
const _ytpl = require('youtube-playlist');
const _sndl = require('youtube-dl');

class player extends require('../handler').handler
{
  get ID()
  {
    return 'player';
  }

  constructor(genialo)
  {
    super(genialo);

    this.ytsc = {
      max_results: 5
    };

    this.current_search = null;
  }

  youtube_search(str)
  {
    return new Promise(resolve => {
      // check if the requested string is a url
      let re_url = /^http.+$/g;
      if (re_url.test(str))
      {
        // url: queue requested song immediately
        resolve({
          error: undefined,
          results: [
            { url: str, title: str }
          ]
        });
      }
      else
      {
        // search string: search youtube and return first matches as defined by this.ytsc.opts
        _ytsc(str, (err, results) => {
          if (!results || results.length == 0)
          {
            err = `no match found for: ${str}`;
          }
          if (err)
          {
            resolve({
              error  : err,
              results: []
            });
          }
          let r = [];
          for (let result of results.videos)
          {
            r.push({
              url  : result.url,
              title: result.title,
              dur  : result.timestamp
            });
          }
          resolve({
            error  : undefined,
            results: r
          });
        });
      }
    });
  }

  /// return the provider of a given url: youtube, soundcloud
  provider(url)
  {
    let re = /^(?:https?:)\/\/((?:www|m)\.)?((?:youtube\.com|youtu.be))\/.+$/g;
    if (re.test(url))
    {
      return 'youtube';
    }
    re = /^(?:https?:)\/\/((?:www|m)\.)?((?:soundcloud.com))\/.+$/g;
    if (re.test(url))
    {
      return 'soundcloud';
    }
    return 'unknown';
  }

  /// push a given url in the current voice queue
  /// actual way to fetch music data will depend on the url
  async queue_url(voice_channel, text_channel, url, title, quiet)
  {
    return new Promise(async resolve => {
      // by default: simply forward the url to discord
      let fn = () => { return url };
      let prov = this.provider(url);
      if (prov == 'youtube')
      {
        // check if the provided url is a playlist
        try
        {
          _ytpl(url, ['id', 'name', 'url']).then(async results => {
            // recursively queue all elements from the playlist
            let r = undefined;
            for (let result of results.data.playlist)
            {
              r = await this.queue_url(voice_channel, text_channel, result.url, result.name, true);
            }
            text_channel.send(`:clock: Queued ${results.data.playlist.length} songs from playlist :clock:`);
            resolve();
          });

          return;
        }
        catch(error)
        {
          // not a playlist: consider it as a plain youtube url
          fn = _ytdl.bind(this, url, {filter: 'audioonly'});
        }
      }
      else if (prov == 'soundcloud')
      {
        fn = _sndl.bind(this, url, ['-x']);
      }

      let r = await this.genialo.voice.push(voice_channel, title, fn, () => {
        text_channel.send(`:musical_note: Now playing **${title}** :musical_note:\n${url}`);
      });

      if (r !== 0 && !quiet)
      {
        text_channel.send(`:clock: Your song **${title}** has been queued in position #${r} :clock:`);
      }

      resolve();
    });
  }

  async handle_play(str, message)
  {
    // check arguments
    if (str.length == 0)
    {
      message.channel.send(`:no_entry: Please type !play **search string or url** :no_entry:`);
      return;
    }
    // check if the user is in a voice channel
    let voice_channel = this.genialo.voice_channel(message.author);
    if (!voice_channel)
    {
      message.channel.send(`:no_entry: You are not in a voice channel. :no_entry:`)
      return;
    }

    let r = await this.youtube_search(str);
    if (!r)
    {
      r = {error: "internal error"};
    }
    else if (!r.error && (!r.results || r.results.length == 0))
    {
      r.error = "no result";
    }

    if (r.error)
    {
      message.channel.send(`:warning: YouTube search failed: ${r.error} :warning:`)
      return;
    }

    this.queue_url(voice_channel, message.channel, r.results[0].url, r.results[0].title);
  }

  async handle_search(str, message)
  {
    // check arguments
    if (str.length == 0)
    {
      message.channel.send(`:no_entry: Please type !play **search string or url** :no_entry:`);
      return;
    }
    // check if the user is in a voice channel
    let voice_channel = this.genialo.voice_channel(message.author);
    if (!voice_channel)
    {
      message.channel.send(`:no_entry: You are not in a voice channel. :no_entry:`)
      return;
    }

    // reset current search and run the new one
    this.current_search = null;
    let r = await this.youtube_search(str);
    if (r.error)
    {
      // failure
      message.channel.send(`:warning: YouTube search failed: ${r.error} :warning:`)
      return;
    }

    // copy results and trim to the number of max results
    this.current_search = r;
    if (this.current_search.results.length > this.ytsc.max_results)
    {
      this.current_search.results.length = this.ytsc.max_results;
    }

    let m = ':notes:Here are the results for your search::notes:\n';
    for (let ii=0; ii < this.current_search.results.length; ++ii)
    {
      m += `:small_blue_diamond: #${ii+1}: ${this.current_search.results[ii].title} (${this.current_search.results[ii].dur})\n`
    }
    m += `Please type-in *!choose <1-${this.current_search.results.length}>*`
    message.channel.send(m);
  }

  async handle_choose(str, message)
  {
    if (this.current_search == null)
    {
      message.channel.send(':no_entry: Please type-in *!search <search string>* first :no_entry:');
      return;
    }

    let args = str.split(' ');
    if (args.length == 0 || isNaN(parseInt(args[0])) || parseInt(args[0]) <= 0 || parseInt(args[0]) > this.current_search.results.length)
    {
      message.channel.send(`:no_entry: Please type-in *!choose <1-${this.current_search.results.length}>* to choose a music to play :no_entry:`);
      return;
    }


    // check if the user is in a voice channel
    let voice_channel = this.genialo.voice_channel(message.author);
    if (!voice_channel)
    {
      message.channel.send(`:no_entry: You are not in a voice channel. :no_entry:`)
      return;
    }

    // fetch chosen entry and clear current search
    let p = this.current_search.results[parseInt(args[0])-1];
    this.current_search = null;

    this.queue_url(voice_channel, message.channel, p.url, p.title);
  }

  handle_skip(str, message)
  {
    message.channel.send(":fast_forward: Skipping current song :fast_forward:");
    this.genialo.voice.next();
  }

  handle_stop(str, message)
  {
    message.channel.send(":octagonal_sign: Stopping :octagonal_sign:");
    this.genialo.voice.queue = [];
    this.genialo.voice.next();
  }

  handle_queue(str, message)
  {
    if (str.length == 0)
    {
      // no argument: simply print the current queue
      if (this.genialo.voice.queue.length == 0)
      {
        message.channel.send(":no_mouth: Current music queue is empty :no_mouth:");
        return;
      }

      let m = `:musical_score: Here is the current music queue: :musical_score:\n\n`;
      for (let ii=0; ii < this.genialo.voice.queue.length; ++ii)
      {
        let e = this.genialo.voice.queue[ii];
        m += `:small_blue_diamond: #${ii+1}: ${e.name}\n`;
      }

      message.channel.send(m);

      return;
    }

    let args = str.split(' ');
    if (args[0] == 'remove' && args.length == 2 && !isNaN(parseInt(args[1])) && parseInt(args[1]) <= this.genialo.voice.queue.length && parseInt(args[1]) > 0)
    {
      // user asked to remove a specific index from the queue
      let removed = this.genialo.voice.queue[parseInt(args[1])-1];
      this.genialo.voice.queue.splice(parseInt(args[1])-1, 1);
      message.channel.send(`:broom: Removed ${removed.name} from the current queue :broom:`);
    }

    else if (args[0] == 'clear')
    {
      // user asked to clear the current queue
      this.genialo.voice.queue = [];
      message.channel.send(`:fire: Current queue has been cleared :fire:`);
    }

    else
    {
      let m = 'Usage:\n';
      m += '*!queue*: Shows the current music queue.\n';
      m += `*!queue remove [1-${this.genialo.voice.queue.length != 0 ? this.genialo.voice.queue.length : 'X'}]*: Removes a specific entry in the music queue.\n`;
      m += `*!queue clear*: Removes all queued entries.\n`;
      message.channel.send(m);
    }
  }
}

function register(genialo)
{
  const p = new player(genialo);

  genialo.register("message", p.ID, (args) =>
  {
    p.on_message(args[0]);
  });

  genialo.hdata[p.ID] = p;
}

module.exports.register = register;

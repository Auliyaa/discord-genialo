const _ytsc = require('yt-search');
const _ytdl = require('ytdl-core');

class player
{
  get ID()
  {
    return '!play';
  }

  constructor(genialo)
  {
    this.genialo = genialo;

    this.ytsc = {
      max_results: 5
    };

    this.current_search = null;
  }

  youtube_search(str)
  {
    return new Promise(resolve => {
      // check if the requested string is a url
      let re = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;
      if (re.test(str))
      {
        // youtube url: queue requested song immediately
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
    if (r.error)
    {
      message.channel.send(`:warning: YouTube search failed: ${r.error} :warning:`)
      return;
    }

    let len = this.genialo.push_audio(voice_channel, _ytdl.bind(this, r.results[0].url, {filter: 'audioonly'}),
                () => {
                  message.channel.send(`:musical_note: Now playing **${r.results[0].title}** :musical_note:\n${r.results[0].url}`);
                });
    if (len !== 0)
    {
      message.channel.send(`:clock: Your song **${r.results[0].title}** has been queued in position #${len} :clock:`);
    }
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
      m += `:small_blue_diamond: #${ii+1}: ${this.current_search.results[ii].title}\n`
    }
    m += `Please type-in *!choose <1-${this.current_search.results.length}>*`
    message.channel.send(m);
  }

  handle_choose(str, message)
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
    let len = this.genialo.push_audio(voice_channel, _ytdl.bind(this, p.url, {filter: 'audioonly'}),
                () => {
                  message.channel.send(`:musical_note: Now playing **${p.title}** :musical_note:\n${p.url}`);
                });
    if (len !== 0)
    {
      message.channel.send(`:clock: Your song **${p.title}** has been queued in position #${len} :clock:`);
    }
  }

  handle_skip(str, message)
  {
    message.channel.send(":fast_forward: Skipping current song :fast_forward:");
    this.genialo.next_audio();
  }

  handle_stop(str, message)
  {
    message.channel.send(":octagonal_sign: Stopping :octagonal_sign:");
    this.genialo.voice.queue = [];
    this.genialo.next_audio();
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

  on_message(message)
  {
    // message is handled it it fits the following pattern:
    // <!command> <args>
    // where supported commands are documented in this class
    if (message.content.startsWith('!'))
    {
      let args = message.content.split(' ');
      let cmd  = args[0].split('!')[1];
      args.shift();

      let h = this.mlocate(`handle_${cmd}`);
      if (h)
      {
        h.bind(this)(args.join(' '), message);
      }
    }
  }

  mlocate(name)
  {
    let r = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).find(n => { return n == name });
    return (r ? this[r] : undefined);
  }
}

function register(genialo)
{
  const p = new player(genialo);

  genialo.register("message", p.ID, (args) =>
  {
    if (genialo.developer && args[0].author.username !== 'Auliyaa')
    {
      return;
    }
    p.on_message(args[0]);
  });

  genialo.hdata[p.ID] = p;
}

module.exports.register = register;

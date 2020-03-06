const _ytsc = require('youtube-search');
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
      opts: {
        maxResults: 5,
        key: genialo.config.get('youtube','token')
      }
    };
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
        _ytsc(str, this.ytsc.opts, (err, results) => {
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
          for (let result of results)
          {
            r.push({
              url  : result.link,
              title: result.title
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

    let len = this.genialo.queue(voice_channel, _ytdl.bind(this, r.results[0].url, {filter: 'audioonly'}),
                () => {
                  message.channel.send(`:musical_note: Now playing **${r.results[0].title}** :musical_note:\n${r.results[0].url}`);
                });
    if (len !== 0)
    {
      message.channel.send(`:clock: Your song **${r.results[0].title}** has been queued in position #${len} :clock:`);
    }
  }

  handle_playc(str)
  {

  }

  handle_choose(str)
  {

  }

  handle_queue(str)
  {
    console.log(str);
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
    p.on_message(args[0]);
  });

  genialo.hdata[p.ID] = p;
}

module.exports.register = register;

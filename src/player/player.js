class player
{
  get ID()
  {
    return '!play';
  }

  constructor(genialo)
  {
    this.genialo = genialo;
  }

  handle_play(str, message)
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

    // check if the requested string is a url
    let audio = undefined;
    let re = /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com|youtu.be))(\/(?:[\w\-]+\?v=|embed\/|v\/)?)([\w\-]+)(\S+)?$/g;
    if (re.test(str))
    {
      // youtube url: queue requested song immediately
    }
    else
    {
      // search string: search youtube and queue first match
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

const rest = require('node-rest-client').Client;

class gamedeals extends require('../handler').handler
{
  get ID()
  {
    return '!gamedeals';
  }

  constructor(genialo)
  {
    super(genialo);

    this.genialo = genialo;
    this.client = new rest();
    this.opts = {
      max_posts: 5
    };

    // locate target channel if provided in the configuration
    if (this.genialo.config.get('gamedeals', 'channel'))
    {
      for (let guild of this.genialo.client.guilds.cache)
      {
        for (let channel of guild[1].channels.cache)
        {
          if (channel[0] == this.genialo.config.get('gamedeals', 'channel'))
          {
            this.channel = channel[1];
          }
        }
      }
    }

    // start timer if an hour of day has been provide din the configuration
    if (this.genialo.config.get('gamedeals', 'hour') && this.channel)
    {
      // post immediately and start timer
      this.interval = genialo.client.setInterval((async () => {
        if (new Date().getHours() != parseInt(this.genialo.config.get('gamedeals', 'hour')))
        {
          return;
        }
        this.post(this.channel);
      }).bind(this), 60*60*1000); // every hour
    }
  }

  async post(channel)
  {
    // fetch results & send messages
    let r = await this.fetch();
    channel.send(`:moneybag: Here are the top ${r.length} deals of the day from /r/gamedeals :moneybag:\n`);
    for (let ii=0; ii < r.length; ++ii)
    {
      let post = r[ii];
      channel.send(`\`\`\`#${ii+1}: ${post.title} (+${post.score})\n\nhttp://www.reddit.com/${post.link}\`\`\``);
    }
  }

  async fetch()
  {
    return new Promise(resolve => {
      this.client.get(`https://www.reddit.com/r/gamedeals/top/.json?t=day`, (data, response) => {
        let r = [];
        if (!data)
        {
          resolve(r);
        }
        for (let child of data.data.children)
        {
          r.push({
            title: child.data.title,
            link : child.data.permalink,
            thumb: child.data.thumbnail,
            score: child.data.score
          });
        }
        if (r.length > this.opts.max_posts)
        {
          r.length = this.opts.max_posts;
        }
        resolve(r);
      });
    });
  }

  handle_gamedeals(args, message)
  {
    this.post(message.channel);
  }
}

async function register(genialo)
{
  const h = new gamedeals(genialo);

  genialo.register("message", h.ID, (args) =>
  {
    h.on_message(args[0]);
  });

  genialo.hdata[h.ID] = h;
}

module.exports.register = register;

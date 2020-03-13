const rest = require('node-rest-client').Client;
const discord = require('discord.js');

class gamedeals extends require('../handler').handler
{
  get ID()
  {
    return 'gamedeals';
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
    if (this.get_config('channel'))
    {
      for (let guild of this.genialo.client.guilds.cache)
      {
        for (let channel of guild[1].channels.cache)
        {
          if (channel[0] == this.get_config('channel'))
          {
            this.channel = channel[1];
          }
        }
      }
    }

    // start timer if an hour of day has been provide din the configuration
    if (this.get_config('hour') && this.channel)
    {
      // post immediately and start timer
      this.interval = genialo.client.setInterval((async () => {
        if (new Date().getHours() != parseInt(this.get_config('hour')))
        {
          return;
        }
        this.post(this.channel);
      }).bind(this), 60*60*1000); // every hour
    }
  }

  post(channel)
  {
    // fetch results & send messages
    this.fetch(r => {
      let message_embed = new discord.MessageEmbed()
      .setColor('#2ebf26')
      .setTitle(`:moneybag: /r/gamedeals top ${r.length} deals of the day :moneybag:`)
      .setURL('http://www.reddit.com/r/gamedeals')
      .setThumbnail('https://styles.redditmedia.com/t5_2qwx3/styles/communityIcon_n3y6x4zozxp01.png')
      .setImage('https://img.gg.deals/a4/d4/a2603f87257f54bbec198fd158284df7ded4_740xt.gif')
      .setTimestamp()
      .setFooter('I love money ... and video games', 'https://styles.redditmedia.com/t5_2qwx3/styles/communityIcon_n3y6x4zozxp01.png');

      const pic_number = [':one:',':two:',':three:',':four:',':five:'];
      for (let ii=0; ii < r.length; ++ii)
      {
        let post = r[ii];
        let title = `${pic_number[ii]} **with +${post.score} upvotes**`;

        //make bold titles
        let value = post.title.replace(/(\[.*\])/,'**$1**');
        //add newline when detecting |
        value = value.replace(/\|/g,'\n');
        //remove html stuff
        value = value.replace(/\&amp;/g,'');
        message_embed.addField(title,`${value} **[\[...\]](http://www.reddit.com/${post.link})**\n`,false);
        }
        channel.send(message_embed);
    });
  }

  fetch(resolve)
  {
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

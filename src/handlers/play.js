const ytdl = require('ytdl-core');
const ytsc = require('youtube-search');

class play
{
  constructor(cfg)
  {
    this.cfg = cfg
    this.ytsc = {}
    this.ytsc.opts = {
      maxResults: 5,
      key: cfg.get('youtube','token')
    }
  }

  get id() {
    return '!play';
  }

  handle(message)
  {
    // !play: look for the requested music over on youtube
    if (message.content.startsWith('!play '))
    {
      ytsc(message.content.replace('!play ',''), this.ytsc.opts, (err, results) => {
        console.dir(results);
      });
      return true;
    }
    return false;
  }
}

module.exports.play = play;

//
// yt_search('never gonna give you up', {maxResults: 5, key: }, (err, results) => {
//   console.dir(results);
// });


// client.on('ready', async () => {
//   for (var channel of client.channels.cache) {
//     if (channel[1].type == 'voice' && channel[1].name == 'La salle de répet')
//     {
//       const cx = await channel[1].join();
//       cx.play(ytdl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', { filter: 'audioonly' }))
//     }
//   }
// });
//
// client.on('channelCreate', () => {
//   console.log("channelCreate");
// });

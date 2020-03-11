class pledges extends require('../handler').handler
{
  get ID()
  {
    return 'pledges';
  }

  constructor(genialo)
  {
    super(genialo);

    this.start = new Date();
    this.start.setTime(1582930800000);

    this.pledges = [
      {
        name    : 'Maj al-Ragath',
        rotation: [
          'Spindleclutch II',
          'Banished Cells I',
          'Fungal Grotto II',
          'Spindleclutch I',
          'Darkshade II',
          'Elden Hollow I',
          'Wayrest Sewers II',
          'Fungal Grotto I',
          'Banished Cells II',
          'Darkshade Caverns I',
          'Elden Hollow II',
          'Wayrest Sewers I'
        ]
      },
      {
        name    : 'Glirion the Redbeard',
        rotation: [
          'Direfrost Keep',
          'Vaults of Madness',
          'Crypt of Hearts II',
          'City of Ash I',
          'Tempest Island',
          'Blackheart Haven',
          'Arx Corinium',
          'Selene\'s Web',
          'City of Ash II',
          'Crypt of Hearts I',
          'Volenfell',
          'Blessed Crucible'
        ]
      },
      {
        name    : 'Urgarlag Chief-bane',
        rotation: [
          'Ruins of Mazzatun',
          'White-Gold Tower',
          'Cradle of Shadows',
          'Bloodroot Forge',
          'Falkreath Hold',
          'Fang Lair',
          'Scalecaller Peak',
          'Moon Hunter Keep',
          'March of Sacrifices',
          'Depths of Malatar',
          'Frostvault',
          'Moongrave Fane',
          'Lair of Maarselok',
          ['Icereach', 'Unhallowed Grave'],
          'Imperial City Prison'
        ]
      },
    ];
  }

  send_pledges(date, title, channel)
  {
    // compute the offset based on the number of days since the start date
    let offset = Math.floor((date.getTime() - this.start.getTime()) / (24*3600*1000));

    // build the response string
    let s = `>>> **${title} (${date.toLocaleDateString()})**\n\n`;

    for (let p of this.pledges)
    {
      let dungeon = p.rotation[offset%p.rotation.length];
      if (typeof dungeon === 'object')
      {
        let rotation_count = Math.floor((new Date().getTime() - this.start.getTime()) / (24*3600*1000*p.rotation.length))
        dungeon = dungeon[rotation_count % dungeon.length];
      }
      s += `${dungeon} -- *${p.name}*\n`;
    }

    channel.send(s);
  }

  handle_pledges(args, message)
  {
    let d = new Date();
    this.send_pledges(d, 'Today`s pledges', message.channel);
    d.setTime(d.getTime() + 24*3600*1000);
    this.send_pledges(d, 'Tomorrow\'s pledges', message.channel);
  }
}

async function register(genialo)
{
  const h = new pledges(genialo);

  genialo.register("message", h.ID, (args) =>
  {
    h.on_message(args[0]);
  });

  genialo.hdata[h.ID] = h;
}

module.exports.register = register;

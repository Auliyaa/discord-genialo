const discord = require('discord.js');
const path = require('path');
const fs = require('fs');

class reactpic extends require('../handler').handler
{
  get ID()
  {
    return 'reactpic';
  }

  constructor(genialo)
  {
    super(genialo);

    this.genialo = genialo;
    this.opts = {
      max_posts: 5
    };
    this.pictures_directory = '.';
    if(this.get_config('pictures-directory')) {
     this.pictures_directory = this.get_config('pictures-directory');
    }
  }
  checkFile(file, user, emotion) {
    return (file.isFile() && file.startsWith(`${user}_${emotion}.`));
  }
  send_image(channel, user, emotion)
  {
    let message_embed = new discord.MessageEmbed()
    .setColor('#6d1991')
    .setTimestamp()

    // get picture path
    const dirents = fs.readdirSync(this.pictures_directory, { withFileTypes: true });
    const pictures = dirents
    .filter(file => this.checkFile(file, user, emotion))
    .map(dirent => dirent.name);

    // fs.readdir(this.pictures_directory, (err,files) => {
    //   if(err) {
    //     console.log('error : ' + err);
    //   }
    //   pictures = files.filter(file => file.startsWith(`${user}_${emotion}.`));
    // });
    if(!pictures) {
      console.log(`Failed to read a ${emotion} ${user} picture : ${error}`)
      message_embed.setTitle(`reactpic Error`)
      .setDescription(`No ${emotion} ${user} have been found !`)
    }
    else {
      const picture_path = `${this.pictures_directory}/${pictures[0]}`;
      message_embed.attachFiles(picture_path)
      .setTitle(`Here's your ${emotion} ${user}`)
      .setImage(`attachment://${pictures[0]}`)
      .setFooter('What a great face', `attachment://${pictures[0]}`);
    }
    channel.send(message_embed);
  }

  send_usage(channel)
  {
    let usage = `*${this.genialo.prefix}reactpic list* : List all images.\n`;
    usage += `*${this.genialo.prefix}reactpic list [pattern]* : List all images associated with a keyword.\n`;
    usage += `*${this.genialo.prefix}reactpic [user] [emotion]* : Show reaction picture, using a user name associated with an emotion.\n`;

    let message_embed = new discord.MessageEmbed()
    .setTitle(`reactpic Usage`)
    .setColor('#6d1991')
    .setDescription(usage)
    .setTimestamp();
    channel.send(message_embed);
  }

  send_list(channel, files, pattern = '')
  {
    files = files.filter(file => file.includes(`${pattern}`));
    let message = '';
    files.forEach(file => {
        console.log(file);
        var name = path.parse(file).name;
        const splitted = name.split('_');
        const user = splitted[0];
        const emotion = splitted[1];
        message += `${user} ${emotion}\n`
    });

    let message_embed = new discord.MessageEmbed()
    .setTitle(`Pictures associated with keyword *${pattern}'*`)
    .setColor('#6d1991')
    .setDescription(message)
    .setTimestamp();
    channel.send(message_embed);
  }

  async handle_reactpic(args, message)
  {
    const splitted = args.split(' ');
    // splitted.forEach(el => console.log('el : ' + el));
    if(splitted[0] === '') {
      this.send_usage(message.channel);
    }
    else {
      //list images
      if(splitted[0] === 'list') {
        var files = fs.readdirSync(this.pictures_directory);
        //list all images
        if(splitted.length === 1) {
          this.send_list(message.channel, files)
        }
        //list images with associated with a keyword
        else {
          this.send_list(message.channel, files, splitted[1]);
        }
      }
      //send image
      else {
        const user = splitted[0];
        const emotion = splitted[1];
        await this.send_image(message.channel, user, emotion);
      }
    }
  }
}

async function register(genialo)
{
  const h = new reactpic(genialo);

  genialo.register("message", h.ID, (args) =>
  {
    h.on_message(args[0]);
  });

  genialo.hdata[h.ID] = h;
}

module.exports.register = register;

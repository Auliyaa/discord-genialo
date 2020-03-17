const discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const getUrls = require('get-urls');

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

    let pictures;
    fs.readdir(this.pictures_directory, (err,files) => {
      if(err) {
        console.log('error : ' + err);
      }
      pictures = files.filter(file => file.startsWith(`${user}_${emotion}.`), (err, fs) =>{
        console.log(fs);
      });
      if(pictures.length === 0) {
        console.log(`Failed to read a ${emotion} ${user} picture`)
        message_embed.setTitle(`reactpic Error`)
        .setDescription(`No ${emotion} ${user} have been found !`)
      }
      else {
        const picture_path = `${this.pictures_directory}/${pictures[0]}`;
        const extension = path.extname(picture_path);
        //the file is html or text
        if(extension === '.html' || extension === '.txt') {
          fs.readFile(picture_path, 'utf8', (err, contents) => {
            //detecting urls from file
            var urls = getUrls(contents);
            console.log(urls);
            if(urls.size != 0) {

              //get the rest of the string for title
              let title = contents;
              urls.forEach(url => {
                title = title.replace(url, '');
                title = title.replace('\n', '');
              });
              if(title === '') {
                title = `Here's your ${emotion} ${user}`;
              }

              //get the first url
              const url = urls.values().next().value;

              //send message
              message_embed.setTitle(title)
              .setImage(url)
              .setFooter('What a great face', url);
              channel.send(message_embed);
            }
          });
        }
        //file is a picture
        else {
          message_embed.attachFiles(picture_path)
          .setTitle(`Here's your ${emotion} ${user}`)
          .setImage(`attachment://${pictures[0]}`)
          .setFooter('What a great face', `attachment://${pictures[0]}`);
          channel.send(message_embed);
        }
      }
    });
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

  send_list(channel, pattern = '')
  {
    fs.readdir(this.pictures_directory, { withFileTypes: true }, (err,elements) => {
      const additionnal_title = (pattern === '') ? '' : ` with keyword **'${pattern}'**`;
      let message_embed = new discord.MessageEmbed()
      .setTitle(`Pictures associated${additionnal_title}`)
      .setColor('#6d1991')
      .setTimestamp();
      let files = elements.filter(file => (file.isFile() && file.name.includes(`${pattern}`)));
      files.forEach(file => {
        const name = path.parse(file.name).name;
        const splitted = name.split('_');
        const user = splitted[0];
        const emotion = splitted[1];
        message_embed.addField(`**${user} ${emotion}**`,`*${this.genialo.prefix}reactpic ${user} ${emotion}*`,true);
      });
      channel.send(message_embed);
    });
  }

  handle_reactpic(args, message)
  {
    const splitted = args.split(' ');
    if(splitted[0] === '') {
      this.send_usage(message.channel);
    }
    else {
      //list images
      if(splitted[0] === 'list') {
          //list all images
          if(splitted.length === 1) {
            this.send_list(message.channel)
          }
          //list images with associated with a keyword
          else {
            this.send_list(message.channel, splitted[1]);
          }
      }
      //send image
      else {
        const user = splitted[0];
        const emotion = splitted[1];
        if(user && emotion) {
          this.send_image(message.channel, user, emotion);
        }
        else this.send_usage(message.channel);
      }
    }
  }
}

function register(genialo)
{
  const h = new reactpic(genialo);

  genialo.register("message", h.ID, (args) =>
  {
    h.on_message(args[0]);
  });

  genialo.hdata[h.ID] = h;
}

module.exports.register = register;

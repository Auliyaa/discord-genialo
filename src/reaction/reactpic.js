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
    this.color = '#7b42f5';
    if(this.get_config('pictures-directory')) {
     this.pictures_directory = this.get_config('pictures-directory');
    }
  }

  send_image(channel, user, emotion)
  {
    //reading directory
    fs.readdir(this.pictures_directory, (err,files) => {
      if(err) {
        console.log(`[${this.ID()}] error : ${err}`);
      }
      const pictures = files.filter(file => file.startsWith(`${user}_${emotion}.`));
      if(pictures.length === 0) {
        //sending error message
        let message_embed = new discord.MessageEmbed()
        .setTitle(`No ${emotion} ${user} have been found !`)
        .setColor(this.color)
        .setTimestamp();
        channel.send(message_embed);
      }
      else {
        const picture_path = `${this.pictures_directory}/${pictures[0]}`;
        const extension = path.extname(picture_path);
        //the file is html or text
        if(extension === '.html' || extension === '.txt') {
          fs.readFile(picture_path, 'utf8', (err, contents) => {
            if(err) {
              console.log(`[${this.ID()}] error : ${err}`);
            }
            //detecting urls from file
            var urls = getUrls(contents);
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

              //sending message
              let message_embed = new discord.MessageEmbed()
              .setTitle(title)
              .setImage(url)
              .setFooter('What a great face', url)
              .setColor(this.color)
              .setTimestamp();
              channel.send(message_embed);
            }
          });
        }
        //file is a picture
        else {
          //sending message
          let message_embed = new discord.MessageEmbed()
          .attachFiles(picture_path)
          .setTitle(`Here's your ${emotion} ${user}`)
          .setImage(`attachment://${pictures[0]}`)
          .setFooter('What a great face', `attachment://${pictures[0]}`)
          .setColor(this.color)
          .setTimestamp();
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
    .setColor(this.color)
    .setDescription(usage)
    .setTimestamp();
    channel.send(message_embed);
  }

  send_list(channel, pattern = '')
  {
    fs.readdir(this.pictures_directory, { withFileTypes: true }, (err,elements) => {
      //add additional title if the user has given a search pattern
      const additional_title = (pattern === '') ? '' : ` with keyword **'${pattern}'**`;

      //preparing message to send
      let message_embed = new discord.MessageEmbed()
      .setTitle(`Pictures associated${additional_title}`)
      .setColor(this.color)
      .setTimestamp();

      //filtering elements if is a file if his name contains the search pattern
      let files = elements.filter(file => (file.isFile() && file.name.includes(`${pattern}`)));

      files.forEach(file => {
        //file.name includes extension, so we get rid of it
        const name = path.parse(file.name).name;
        const tokens = name.split('_');
        const user = tokens[0];
        const emotion = tokens[1];
        message_embed.addField(`**${user} ${emotion}**`,`*${this.genialo.prefix}reactpic ${user} ${emotion}*`,true);
      });

      //sending message
      channel.send(message_embed);
    });
  }

  handle_reactpic(args, message)
  {
    const tokens = args.split(' ');
    if(tokens[0] === '') {
      this.send_usage(message.channel);
    }
    else {
      //list images
      if(tokens[0] === 'list') {
          //list all images
          if(tokens.length === 1) {
            this.send_list(message.channel)
          }
          //list images with associated with a keyword
          else {
            this.send_list(message.channel, tokens[1]);
          }
      }
      //send image
      else {
        const user = tokens[0];
        const emotion = tokens[1];
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

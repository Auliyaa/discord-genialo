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
    this.pictures_directory = this.get_config('pictures-directory') ? this.get_config('pictures-directory') : '.';
    this.color = '#7b42f5';
  }

  //send an error message for the giver user / emotion
  send_error_message(channel, message)
  {
    let message_embed = new discord.MessageEmbed()
    .setTitle(message)
    .setColor(this.color)
    .setTimestamp();
    channel.send(message_embed);
  }
  //send usage
  send_usage(channel)
  {
    let usage = `*${this.genialo.prefix}reactpic list* : List all images.\n`;
    usage += `*${this.genialo.prefix}reactpic list [pattern]* : List all images associated with an optional pattern.\n`;
    usage += `*${this.genialo.prefix}reactpic [user] [emotion]* : Show reaction picture, using a user name associated with an emotion.\n`;
    usage += `*${this.genialo.prefix}reactpic random [pattern]* : Show a random reaction with an optional pattern.\n`;

    let message_embed = new discord.MessageEmbed()
    .setTitle(`reactpic Usage`)
    .setColor(this.color)
    .setDescription(usage)
    .setTimestamp();
    channel.send(message_embed);
  }

  //send given image
  send_image(channel, picture)
  {
    const picture_path = `${this.pictures_directory}/${picture}`;
    const extension = path.extname(picture_path);

    //remove extension and get user/emotion
    const name = path.parse(picture).name;
    const tokens = name.split('_');
    const user = tokens[0];
    const emotion = tokens[1];

    if(extension === '.html' || extension === '.txt')
    {
      // requested element is not a picture: parse it and forward embbeded urls
      fs.readFile(picture_path, 'utf8', (err, contents) => {
        if(err)
        {
          console.error(`[${this.ID()}] error: ${err}`);

          //sending error message
          this.send_error_message(channel, `No picture found for ${emotion} / ${user} !`);
        }
        else
        {
          var urls = getUrls(contents);

          if (urls.size != 0)
          {
            // get the rest of the string for title
            let title = contents;
            urls.forEach(url => {
              title = title.replace(url, '');
              title = title.replace('\n', '');
            });
            if(title === '')
            {
              title = `Here's your ${emotion} ${user}`;
            }

            // get the first url & send message
            const url = urls.values().next().value;

            let message_embed = new discord.MessageEmbed()
            .setTitle(title)
            .setImage(url)
            .setFooter('What a great face', url)
            .setColor(this.color)
            .setTimestamp();
            channel.send(message_embed);
          }
          else
          {
            //sending error message
            this.send_error_message(channel, `No picture found for ${emotion} / ${user} !`);
          }
        }
      });
    }
    // resource is a picture
    else
    {
      // sending message
      let message_embed = new discord.MessageEmbed()
      .attachFiles(picture_path)
      .setTitle(`Here's your ${emotion} ${user}`)
      .setImage(`attachment://${picture}`)
      .setFooter('What a great face', `attachment://${picture}`)
      .setColor(this.color)
      .setTimestamp();
      channel.send(message_embed);
    }
  }

  // send an image with a pattern, or random, or random with pattern
  search_and_send_image(channel, random, pattern = '')
  {
    //make sure that we have a valid pattern if we're not in random mode ("user_emotion.")
    if(!random && !(/^[a-zA-Z0-9]+_[a-zA-Z0-9]+\.$/.test(pattern)))
    {
      this.send_usage(channel);
    }
    else
    {
      //reading directory
      fs.readdir(this.pictures_directory, { withFileTypes: true }, (err,files) => {
        if(err)
        {
          console.error(`[${this.ID}] error: ${err}`);
          this.send_error_message(channel, `No picture found !`)
        }
        else
        {
          //filtering elements if is a file if his name contains the search pattern
          const pictures = files.filter(file => (file.isFile() && file.name.includes(`${pattern}`)));
          if(pictures.length === 0)
          {
            //send error message
            let value = pattern;
            if(!random)
            {
              value = value.replace('.', '');
              const tokens = value.split('_');
              const user = tokens[0];
              const emotion = tokens[1];
              value = `${emotion} / ${user}`;
            }
            this.send_error_message(channel, `No picture found for ${value} !`);
          }
          else
          {
            if(random)
            {
              //chose a file randomly and send it
              const picture_index = Math.floor(Math.random() * Math.floor(pictures.length));
              this.send_image(channel, pictures[picture_index].name);
            }
            else
            {
              this.send_image(channel, pictures[0].name);
            }
          }
        }
      });
    }
  }

  send_list(channel, pattern = '')
  {
    fs.readdir(this.pictures_directory, { withFileTypes: true }, (err,elements) => {
      //add additional title if the user has given a search pattern
      const additional_title = (pattern === '') ? '' : ` with keyword **'${pattern}'**`;

      //preparing message to send
      let message_embed = new discord.MessageEmbed()
      .setTitle(`Pictures ${additional_title}`)
      .setColor(this.color)
      .setTimestamp();

      if(err)
      {
        console.error(`[${this.ID}] error: ${err}`);
      }
      else
      {
        //filtering elements if is a file if his name contains the search pattern
        let files = elements.filter(file => (file.isFile() && file.name.includes(`${pattern}`)));

        files.forEach(file =>
        {
          //file.name includes extension, so we get rid of it
          const name = path.parse(file.name).name;
          const tokens = name.split('_');
          const user = tokens[0];
          const emotion = tokens[1];
          message_embed.addField(`**${user} ${emotion}**`,`*${this.genialo.prefix}reactpic ${user} ${emotion}*`,true);
        });
      }
      //sending message
      channel.send(message_embed);
    });
  }

  handle_reactpic(args, message)
  {
    const tokens = args.split(' ');
    if(tokens[0].length === 0)
    {
      this.send_usage(message.channel);
    }
    else
    {
      // list images
      if(tokens[0] === 'list')
      {
          // list all images
          if(tokens.length === 1)
          {
            this.send_list(message.channel)
          }
          // list images with associated with a keyword
          else
          {
            this.send_list(message.channel, tokens[1]);
          }
      }
      // random mode with an optional pattern
      else if(tokens[0] === 'random')
      {
        //send a random image
        if(tokens.length === 1)
        {
          this.search_and_send_image(message.channel, true)
        }
        //send a random image filtered by a given pattern
        else
        {
          this.search_and_send_image(message.channel, true, tokens[1]);
        }
      }
      //send image
      else
      {
        const user = tokens[0];
        const emotion = tokens[1];
        if(user && emotion)
        {
          //send a specific image
          this.search_and_send_image(message.channel, false, `${user}_${emotion}.`);
        }
        else
        {
          this.send_usage(message.channel);
        }
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

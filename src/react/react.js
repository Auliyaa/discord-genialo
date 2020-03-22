const discord = require('discord.js');
const path = require('path');
const fs = require('fs');
const getUrls = require('get-urls');

class react extends require('../handler').handler
{
  get ID()
  {
    return 'react';
  }

  constructor(genialo)
  {
    super(genialo);

    this.genialo = genialo;
    this.opts = {
      max_posts: 5
    };
    this.elements_directory = this.get_config('directory') ? this.get_config('directory') : '.';
    this.color = '#7b42f5';
  }

  //send/play given element path
  send_element(message, element)
  {
    const element_path = `${this.elements_directory}/${element}`;
    const extension = path.extname(element_path);

    //remove extension and get user/emotion
    const tokens = this.get_user_emotion_from_file(element);
    const user = tokens[0];
    const emotion = tokens[1];

    if(extension === '.html' || extension === '.txt')
    {
      this.get_infos_from_file(element_path, (url, text) => {
        if(url)
        {
          //detect extension from url
          if(url.includes(".png") || url.includes(".jpeg") || url.includes(".jpg"))
          {
            let message_embed = new discord.MessageEmbed()
            .setTitle(text)
            .setImage(url)
            .setFooter('What a great face', url)
            .setColor(this.color)
            .setTimestamp();
            message.channel.send(message_embed);
          }
          //sound
          else if(url.includes(".mp3") || url.includes(".wav"))
          {
            let voice_channel = this.genialo.voice_channel(message.author);
            if (!voice_channel)
            {
              this.send_error_message(message.channel, `Can't play ${emotion} / ${user}, ${message.author} you're not in a voice channel ! `);
            }
            else
            {
              //playing sound
              this.genialo.voice.push(voice_channel, 'sample', 'sample', () => { return url; });
            }
          }
          else
          {
            //sending error message
            this.send_error_message(message.channel, `No element found for ${emotion} / ${user} !`);
          }
        }
        else
        {
          //sending error message
          this.send_error_message(message.channel, `No element found for ${emotion} / ${user} !`);
        }
      });
    }
    // resource is a picture
    else if(extension === '.png' || extension === '.jpeg' || extension === '.jpg')
    {
      // sending message
      let message_embed = new discord.MessageEmbed()
      .attachFiles(element_path)
      .setTitle(`Here's your ${emotion} ${user}`)
      .setImage(`attachment://${element}`)
      .setFooter('What a great face', `attachment://${element}`)
      .setColor(this.color)
      .setTimestamp();
      message.channel.send(message_embed);
    }
    //sound
    else if(extension === '.mp3' || extension === '.wav')
    {
      let voice_channel = this.genialo.voice_channel(message.author);
      if (!voice_channel)
      {
        this.send_error_message(message.channel, `Can't play ${emotion} / ${user}, ${message.author} you're not in a voice channel ! `);
      }
      else
      {
        //playing sound
        this.genialo.voice.push(voice_channel, 'sample', 'sample', () => { return element_path; });
      }
    }
    else
    {
      //sending error message
      this.send_error_message(message.channel, `No element found for ${emotion} / ${user} !`);
    }
  }

  //return user and emotion from file name
  get_user_emotion_from_file(file_name)
  {
    const name = path.parse(file_name).name;
    const tokens = name.split('_');
    return tokens;
  }

  //return url and text in the callback given
  get_infos_from_file(file_path, on_finish) {
    fs.readFile(file_path, 'utf8', (err, contents) => {
      //what we will return in the callback
      let url;
      let text = '';

      if(err)
      {
        console.error(`[${this.ID}] error: ${err}`);
      }
      else
      {
        var urls = getUrls(contents);
        if (urls.size != 0)
        {
          //remove extension and get user/emotion
          const tokens = this.get_user_emotion_from_file(file_path);
          const user = tokens[0];
          const emotion = tokens[1];

          // get the rest of the string for title
          let value = contents;
          urls.forEach(url => {
            value = value.replace(url, '');
            value = value.replace('\n', '');
          });
          if(value === '')
          {
            value = `Here's your ${emotion} ${user}`;
          }
          //setting the returning text
          text = value;

          //setting the returning url
          url = urls.values().next().value;
        }
      }
      on_finish(url, text);
    });
  }

  // send an image/sound with a pattern, or random, or random with pattern
  search_and_send_element(message, random, pattern = '')
  {
    //make sure that we have a valid pattern if we're not in random mode ("user_emotion.")
    if(!random && !(/^[a-zA-Z0-9]+_[a-zA-Z0-9]+\.$/.test(pattern)))
    {
      this.send_usage(message.channel);
    }
    else
    {
      //reading directory
      fs.readdir(this.elements_directory, { withFileTypes: true }, (err,files) => {
        if(err)
        {
          console.error(`[${this.ID}] error: ${err}`);
          this.send_error_message(message.channel, `No element found !`)
        }
        else
        {
          //filtering elements if is a file if his name contains the search pattern
          const elements = files.filter(file => (file.isFile() && file.name.includes(`${pattern}`)));
          if(elements.length === 0)
          {
            let element_display = pattern;
            if(!random)
            {
              element_display = element_display.replace('.', '');
              const tokens = element_display.split('_');
              element_display = `${tokens[0]} / ${tokens[1]}`;
            }
            //send error message
            this.send_error_message(message.channel, `No element found for ${value} !`);
          }
          else
          {
            if(random)
            {
              //chose a file randomly and send it
              const element_index = Math.floor(Math.random() * Math.floor(elements.length));
              this.send_element(message, elements[element_index].name);
            }
            else
            {
              this.send_element(message, elements[0].name);
            }
          }
        }
      });
    }
  }

  //send list of elements with optional pattern
  send_list(channel, pattern = '')
  {
    fs.readdir(this.elements_directory, { withFileTypes: true }, (err,elements) => {
      //add additional title if the user has given a search pattern
      const additional_title = (pattern === '') ? '' : ` with keyword **'${pattern}'**`;

      //preparing message to send
      let message_embed = new discord.MessageEmbed()
      .setTitle(`Elements ${additional_title}`)
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

        files.forEach(file => {
          //remove extension and get user/emotion
          const tokens = this.get_user_emotion_from_file(file.name);
          const extension = path.extname(file.name);
          const user = tokens[0];
          const emotion = tokens[1];

          //set the type of files
          let type = '[UNKNOWN]';
          //url
          if(extension === '.html' || extension === '.txt')
          {
            type = '[URL]';
          }
          else if(extension === '.png' || extension === '.jpeg' || extension === '.jpg')
          {
            type = '[PIC]';
          }
          //sound
          else if(extension === '.mp3' || extension === '.wav')
          {
            type = '[SOUND]';
          }
          //add field
          message_embed.addField(`**${type} ${user} ${emotion}**`,`*${this.genialo.prefix}reactpic ${user} ${emotion}*`,true);
        });
      }
      //sending message
      channel.send(message_embed);
    });
  }

  //send an error message
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
    let usage = `*${this.genialo.prefix}${this.ID} list* : List all elements.\n`;
    usage += `*${this.genialo.prefix}${this.ID} list [pattern]* : List all elements associated with an optional pattern.\n`;
    usage += `*${this.genialo.prefix}${this.ID} [user] [emotion]* : Send a reaction using a user name associated with an emotion.\n`;
    usage += `*${this.genialo.prefix}${this.ID} random [pattern]* : Send a random reaction with an optional pattern.\n`;

    let message_embed = new discord.MessageEmbed()
    .setTitle(`${this.ID} usage`)
    .setColor(this.color)
    .setDescription(usage)
    .setTimestamp();
    channel.send(message_embed);
  }

  //handle message
  handle_react(args, message)
  {
    const tokens = args.split(' ');
    if(tokens[0].length === 0)
    {
      this.send_usage(message.channel);
    }
    else
    {
      // list elements
      if(tokens[0] === 'list')
      {
        // list all elements
        if(tokens.length === 1)
        {
          this.send_list(message.channel)
        }
        // list elements with associated with a keyword
        else
        {
          this.send_list(message.channel, tokens[1]);
        }
      }
      // random mode with an optional pattern
      else if(tokens[0] === 'random')
      {
        //send a random element
        if(tokens.length === 1)
        {
          this.search_and_send_element(message, true)
        }
        //send a random element filtered by a given pattern
        else
        {
          this.search_and_send_element(message, true, tokens[1]);
        }
      }
      //send element
      else
      {
        const user = tokens[0];
        const emotion = tokens[1];
        if(user && emotion)
        {
          //send a specific element
          this.search_and_send_element(message, false, `${user}_${emotion}.`);
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
  const h = new react(genialo);

  genialo.register("message", h.ID, (args) =>
  {
    h.on_message(args[0]);
  });

  genialo.hdata[h.ID] = h;
}

module.exports.register = register;

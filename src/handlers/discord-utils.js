/// list all channels a given member is in for a given guild
function discord_list_channels(guild, member)
{
  let result = []
  for (let channel of guild.channels.cache)
  {
    for (let m of channel[1].members)
    {
      if (m[0] == member.id)
      {
        result.push(channel[1]);
      }
    }
  }
  return result;
}

/// return the voice channel this user is connected to, or null if none
function discord_voice_channel(guild, member)
{
  let voice_channel = null;
  for (let channel of discord_list_channels(guild, member))
  {
    if (channel.type == 'voice')
    {
      voice_channel = channel;
      break;
    }
  }
  return voice_channel;
}

module.exports.list_channels = discord_list_channels;
module.exports.voice_channel = discord_voice_channel;

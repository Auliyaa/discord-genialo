class handler
{
  constructor(genialo)
  {
    this.genialo = genialo;
  }

  /// fetch an entry from this handler's configuration section
  get_config(key)
  {
    return this.genialo.config.get(this.ID, key);
  }

  /// abstract handler that, given a !<command> will look for the handle_<command> method in the current object and
  ///  call it when available.
  on_message(message)
  {
    // message is handled it it fits the following pattern:
    // <!command> <args>
    // where supported commands are documented in this class
    if (!message.content.startsWith(this.genialo.prefix))
    {
      return;
    }

    // check if the current message is restricted to a specific channel
    let restrict_channel = this.get_config("command-channel");
    if (restrict_channel && message.channel.id != restrict_channel)
    {
      return;
    }

    // parse arguments
    let args = message.content.split(' ');
    let cmd  = args[0].split(this.genialo.prefix)[1];
    args.shift();

    // look for a handler function in the current instance and call it when available
    let h = this.mlocate(`handle_${cmd}`);
    if (h)
    {
      h.bind(this)(args.join(' '), message);
    }
  }

  /// locate a method based on its name in the current instance
  mlocate(name)
  {
    let r = Object.getOwnPropertyNames(Object.getPrototypeOf(this)).find(n => { return n == name });
    return (r ? this[r] : undefined);
  }
}

module.exports.handler = handler;

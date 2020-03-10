class handler
{
  constructor(genialo)
  {
    this.genialo = genialo;
  }

  /// abstract handler that, given a !<command> will look for the handle_<command> method in the current object and
  ///  call it when available.
  on_message(message)
  {
    // message is handled it it fits the following pattern:
    // <!command> <args>
    // where supported commands are documented in this class
    if (message.content.startsWith(this.genialo.prefix))
    {
      let args = message.content.split(' ');
      let cmd  = args[0].split(this.genialo.prefix)[1];
      args.shift();

      let h = this.mlocate(`handle_${cmd}`);
      if (h)
      {
        h.bind(this)(args.join(' '), message);
      }
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

import Discord from 'discord.js';
require('dotenv').config();
import galNet from './galnet';

const prefix = '~';
const client = new Discord.Client();

client.on('message', (message) => {
  // If the author is a bot, return
  if (message.author.bot) return;
  // If message is not a command, return
  if (!message.content.startsWith(prefix)) return;

  const commandBody = message.content.slice(prefix.length);
  const args = commandBody.split(' ');
  const command = args.shift()?.toLowerCase();

  switch (command) {
    case 'ping':
      const timeTaken = Date.now() - message.createdTimestamp;
      message.reply(`Pong! This message had a latency of ${timeTaken}ms.`);
      break;

    default:
      break;
  }
});

client.once('ready', () => {
  console.log('Now listening');
  galNet();
});

client.login(process.env.BOT_TOKEN);

import { REST, Routes } from 'discord.js';
import { config } from './config.js';
import { commands } from './commands/index.js';

const commandsData = commands.map(command => command.data.toJSON());

const rest = new REST({ version: '10' }).setToken(config.discordToken);

(async () => {
  try {
    console.log(`🚀 Started refreshing ${commandsData.length} application (/) commands.`);

    const data = await rest.put(
      Routes.applicationCommands(config.discordClientId),
      { body: commandsData },
    );

    console.log(`✅ Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();

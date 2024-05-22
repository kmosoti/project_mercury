const { REST, Routes } = require('discord.js');
require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const token = process.env.DISCORD_API;
const guildId = process.env.GUILD_ID;
const clientId = process.env.APP_ID;
const commands = [];

// Grab all the command items from the commands directory you created earlier
const commandsPath = path.join(__dirname, 'commands');
const commandItems = fs.readdirSync(commandsPath);

// Function to load a command file
function loadCommand(filePath) {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
    } else {
        console.error(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

for (const item of commandItems) {
    const itemPath = path.join(commandsPath, item);
    const stats = fs.statSync(itemPath);

    if (stats.isDirectory()) {
        // If the item is a directory, read all JS files from it
        const commandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
        for (const file of commandFiles) {
            const filePath = path.join(itemPath, file);
            loadCommand(filePath);
        }
    } else if (stats.isFile() && item.endsWith('.js')) {
        // If the item is a file and it's a JS file, load it directly
        loadCommand(itemPath);
    }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: '10' }).setToken(token);

// and deploy your commands!
(async () => {
    try {
        console.log(`Started refreshing ${commands.length} application (/) commands.`);

        // The put method is used to fully refresh all commands in the guild with the current set
        const data = await rest.put(
            Routes.applicationGuildCommands(clientId, guildId),
            { body: commands }
        );

        // const data = await rest.put(
        //     Routes.applicationCommands(clientId),
        //     { body: commands },
        // );
        
        console.log(`Successfully reloaded ${data.length} application (/) commands.`);
    } catch (error) {
        // Make sure you catch and log any errors!
        console.error(error);
    }
})();

//console log to show that the commands have been deployed
console.log('Deployed commands to Discord!');

//log the commands that have been deployed
console.log(commands);



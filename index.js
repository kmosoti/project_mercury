// Import environment variables from .env file
require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

client.commands = new Collection();
client.music_queue = new Map();
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');
const commandItems = fs.readdirSync(commandsPath);

function loadCommand(filePath) {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`Loaded command: ${command.data.name}`);
    } else {
        console.error(`[ERROR] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

for (const item of commandItems) {
    const itemPath = path.join(commandsPath, item);
    const stat = fs.statSync(itemPath);

    if (stat.isDirectory()) {
        const subcommandFiles = fs.readdirSync(itemPath).filter(file => file.endsWith('.js'));
        subcommandFiles.forEach(file => {
            const filePath = path.join(itemPath, file);
            loadCommand(filePath);
        });
    } else if (stat.isFile() && item.endsWith('.js')) {
        loadCommand(itemPath);
    }
}

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
    }

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(`Error executing command: ${error.message}`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

client.on('voiceStateUpdate', (oldState, newState) => {
    // Check if the bot's voice connection is affected
    if (newState.id === client.user.id) {
        if (!newState.channelId) {
            console.log("Bot was disconnected from the voice channel.");
            // Clear the music queue for this guild when disconnected
            client.music_queue.delete(newState.guild.id);
            // Remove the stored voice channel when disconnected
            client.voiceChannels?.delete(newState.guild.id);
        } else if (newState.channelId !== oldState.channelId) {
            console.log(`Bot has been moved to a new channel: ${newState.channelId}`);
            // Update the stored channel in a guild-specific way
            if (!client.voiceChannels) {
                client.voiceChannels = new Map();
            }
            client.voiceChannels.set(newState.guild.id, newState.channel);
        }
    }
});


client.once(Events.Ready, () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.login(process.env.DISCORD_API);
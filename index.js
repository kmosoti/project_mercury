// Import environment variables from .env file
require('dotenv').config();

const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const commandsPath = path.join(__dirname, 'commands');
let logFile;

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMembers
    ]
});

// Initialize commands and music queue
client.commands = new Collection();
client.music_queue = new Map();

// Function to load a command
function loadCommand(filePath) {
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        log(`Loaded command: ${command.data.name}`);
    } else {
        log(`[ERROR] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load commands from the commands directory
fs.readdirSync(commandsPath).forEach(item => {
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
});

function log(message, level = 'INFO') {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const logFileName = `logs/${dateString}.log`;
    const timestamp = date.toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;

    if (logFile !== logFileName) {
        logFile = logFileName;
        // Create the logs folder if it does not exist
        if (!fs.existsSync('logs')) {
            fs.mkdirSync('logs');
        }
    }

    fs.appendFileSync(logFile, logMessage);
    console.log(logMessage);
}
// Event handler for interactions
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
        log(`No command matching ${interaction.commandName} was found.`, 'ERROR');
        return;
    }

    try {
        const subcommand = interaction.options.getSubcommand();
        const subcommandOptions = interaction.options.data.find(option => option.name === subcommand).options;
        const subcommandOptionsString = subcommandOptions.map(option => `${option.name}: ${option.value}`).join(', ');
        log(`Received interaction: ${interaction.commandName} ${subcommand} from ${interaction.user.tag} with arguments: ${subcommandOptionsString}`);
        await command.execute(interaction);
        log(`Executed command: ${interaction.commandName}`);
    } catch (error) {
        log(`Error executing command: ${error.message}\n${error.stack}`, 'ERROR');
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

// Event handler for voice state updates
client.on('voiceStateUpdate', (oldState, newState) => {
    // Check if the bot's voice connection is affected
    if (newState.id === client.user.id) {
        if (!newState.channelId) {
            log("Bot was disconnected from the voice channel.");
            // Clear the music queue for this guild when disconnected
            client.music_queue.delete(newState.guild.id);
            // Remove the stored voice channel when disconnected
            client.voiceChannels?.delete(newState.guild.id);
        } else if (newState.channelId !== oldState.channelId) {
            log(`Bot has been moved to a new channel: ${newState.channelId}`);
            // Update the stored channel in a guild-specific way
            if (!client.voiceChannels) {
                client.voiceChannels = new Map();
            }
            client.voiceChannels.set(newState.guild.id, newState.channel);
        }
    }
});

// Event handler for the ready event
client.once(Events.Ready, () => {
    log(`Logged in as ${client.user.tag}`);
});

// Login to Discord
client.login(process.env.DISCORD_API);
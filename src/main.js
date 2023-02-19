require('dotenv').config();
const fs = require('fs');

//Get the token from the .env file
const {DISCORD_TOKEN} = process.env;

//get client and collection from discord.js
const {Client, Collection, GatewayIntentBits} = require('discord.js');

const client = new Client({intents: GatewayIntentBits.Guilds});

client.commands = new Collection();
client.command_array = [];

//The functions are sorted into folders, so we need to get all the files in the functions folder
//Get each folder name
const funcion_folders = fs.readdirSync('./src/functions');
//Loop through each folder and get the files
for (const folder of funcion_folders) {
    //Get the files in the folder
    const function_files = fs
        .readdirSync(`./src/functions/${folder}`)
        .filter(file => file.endsWith('.js'));
    //Loop through each file
    for (const file of function_files) {
        //Get the function from the file and pass the client
        require(`./functions/${folder}/${file}`)(client);
    }
}
//Load the events and commands
client.handleCommands();
client.handleEvents();


//login to discord
client.login(DISCORD_TOKEN);

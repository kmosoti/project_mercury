const {REST} = require('@discordjs/rest');
const {Routes} = require('discord-api-types/v9');
const fs = require('fs');

module.exports = (client) => {
    client.handleCommands = async () => {
        const {commands, command_array} = client;
        //get the commands folders
        const command_folders = fs.readdirSync('./src/commands');
        //loop through each folder
        for (const folder of command_folders) {
            const command_files = fs
                .readdirSync(`./src/commands/${folder}`)
                .filter(file => file.endsWith('.js'));

            //loop through each file and add the command to the client
            for (const file of command_files) {
                //console.log(`Command Path: ../../commands/${folder}/${file}`)
                const command = require(`../../commands/${folder}/${file}`);
                commands.set(command.data.name, command);
                command_array.push(command.data.toJSON());
                //log the command
                console.log(`Command: ${command.data.name} loaded`);
            }
        }


        const client_id = '1029979180277956608';
        //const guild_id = '1029977614879830057';

        const rest = new REST({version: '9'}).setToken(process.env.DISCORD_TOKEN);
        try{
            console.log('Started refreshing application (/) commands.');

            await rest.put(
                Routes.applicationCommands(client_id), {
                    //put the commands in the body include name, description, and options as a json object
                    body: client.command_array,
                },
            );

            console.log('Successfully reloaded application (/) commands.');
        } catch (error) {
            console.error(error);
        }
    }
}
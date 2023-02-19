module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        //If the interaction is not a command, return
        if (!interaction.isChatInputCommand()) return;
        //Get the command name
        const commandName = interaction.commandName;

        //Get the command from the client
        const command = client.commands.get(commandName);
        //If the command does not exist, return
        if (!command) return;
        //Execute the command
        try {
            await command.execute(interaction, client);
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'Damn, something went wrong! Please try again later and if the problem persists, contact the bot owner.',
                ephemeral: true,
            });
        }
    },
};

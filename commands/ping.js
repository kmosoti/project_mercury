const {SlashCommandBuilder} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        console.log('Received play command interaction.');
        try {
            await interaction.reply('Pong!');
            console.log('Reply sent successfully.');
        } catch (error) {
            console.error('Failed to send reply:', error);
        }
    },
};

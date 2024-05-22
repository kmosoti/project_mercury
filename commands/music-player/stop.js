const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music, clears the queue, and disconnects the bot.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to stop the music!');
            return;
        }

        const queue = interaction.client.music_queue.get(voiceChannel.guild.id);
        if (!queue) {
            await interaction.reply('There is no music playing to stop.');
            return;
        }

        // Clear the queue
        interaction.client.music_queue.delete(voiceChannel.guild.id);

        // Disconnect the bot from the voice channel
        voiceChannel.guild.members.me.voice.disconnect();

        await interaction.reply('Music stopped, queue cleared, and disconnected from the voice channel.');
    }
};
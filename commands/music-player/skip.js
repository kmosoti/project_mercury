const { SlashCommandBuilder } = require('discord.js');
const { playSong } = require('./play.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the current song in the queue.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to skip the song!');
            return;
        }

        const queue = interaction.client.music_queue.get(voiceChannel.guild.id);
        if (!queue || queue.length === 0) {
            await interaction.reply('There is no song to skip.');
            return;
        }

        const skippedSong = queue.shift();
        interaction.client.music_queue.set(voiceChannel.guild.id, queue);

        await interaction.reply(`**${skippedSong.title}** was skipped by **${interaction.user.username}**.`);

        if (queue.length > 0) {
            playSong(interaction, voiceChannel, queue);
        } else {
            voiceChannel.guild.members.me.voice.disconnect();
            await interaction.followUp('The music queue is now empty. Disconnecting from the voice channel.');
        }
    }
};
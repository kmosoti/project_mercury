const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to view the queue!');
            return;
        }

        const queue = interaction.client.music_queue.get(voiceChannel.guild.id);
        if (!queue || queue.length === 0) {
            await interaction.reply('The music queue is currently empty.');
            return;
        }

        const queueLength = queue.reduce((prev, curr) => {
            const [minutes, seconds] = curr.duration.split(":").map(Number);
            return prev + (minutes * 60) + seconds;
        }, 0);
        
        const hours = Math.floor(queueLength / 3600);
        const minutes = Math.floor((queueLength % 3600) / 60);
        const seconds = queueLength % 60;
        
        const formattedQueueLength = `${hours > 0 ? `${hours}:` : ""}${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
        
        const queueMessage = `**Current Music Queue (${formattedQueueLength}):**\n${queue.map((song, index) => `${index + 1}. (${song.duration})**${song.title}** queued by **${song.requestedBy}**`).join('\n')}`;
        await interaction.reply(queueMessage);
    }
};
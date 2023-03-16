const fs = require('fs');
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, entersState, createAudioPlayer, createAudioResource, VoiceConnectionStatus, AudioPlayerStatus, NoSubscriberBehavior, StreamType } = require('@discordjs/voice');

async function connectToChannel(channel) {
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    try {
        await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
        return connection;
    } catch (error) {
        connection.destroy();
        throw error;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song in the voice channel you are in.'),
    async execute(interaction, client) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply({
                content: 'You need to be in a voice channel to use this command.',
                ephemeral: true,
            });
        }

        // Defer the reply
        await interaction.deferReply();

        try {
            const connection = await connectToChannel(voiceChannel);
            const tempDir = 'C:/Users/kenne/Documents/personal_directory/Projects/project_mercury/project_mercury_00/music';
            const songFile = `${tempDir}/EminemWithoutMe.mp3`;

            const player = createAudioPlayer({
                behaviors: {
                    noSubscriber: NoSubscriberBehavior.Pause,
                },
            });

            const resource = createAudioResource(fs.createReadStream(songFile), {
                inputType: StreamType.Arbitrary,
                metadata: {
                    title: 'Lofi Rap',
                    artist: 'Kenney',
                },
            });

            if (!resource) {
                console.error('Failed to load audio resource');
                return;
            }

            connection.subscribe(player);
            player.play(resource);

            player.once(AudioPlayerStatus.Playing, () => {
                interaction.editReply({ content: 'Now playing a song!' });
            });

            player.once(AudioPlayerStatus.Idle, () => {
                interaction.followUp({ content: 'Song has ended.' });
                connection.destroy();
            });

            player.on('error', error => {
                console.error(error);
            });
        } catch (error) {
            console.error('Failed to join the voice channel:', error);
            interaction.editReply({ content: 'Failed to join the voice channel.', ephemeral: true });
        }
    },
};

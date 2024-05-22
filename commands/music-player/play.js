const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const playdl = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Plays a song in a voice channel.')
        .addStringOption(option =>
            option.setName('keyword-or-url')
                .setDescription('The URL of the song to play or keywords to search')
                .setRequired(true)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        if (!voiceChannel) {
            await interaction.reply('You need to be in a voice channel to play music!');
            return;
        }

        await interaction.deferReply();
        const searchString = interaction.options.getString('keyword-or-url');

        try {
            let videoUrl;
            const searchResults = await playdl.search(searchString, { limit: 1 });
            console.log('Search results:', searchResults);
            if (searchResults.length === 0) {
                await interaction.followUp('No videos found for the search query.');
                return;
            }
            videoUrl = searchResults[0].url; // Access the URL property here
            console.log('Video URL:', videoUrl);

            // Extract song details from the search result
            const songTitle = searchResults[0].title;
            const songDuration = searchResults[0].durationRaw;
            const songArtist = searchResults[0].channel.name;
            const memberName = interaction.member.user.username;

            // Create a song object with the extracted details
            const song = {
                url: videoUrl,
                title: songTitle,
                duration: songDuration,
                artist: songArtist,
                requestedBy: memberName
            };

            // Access the queue for the guild
            const queue = interaction.client.music_queue.get(voiceChannel.guild.id) || [];

            // Add new song to the queue
            queue.push(song);
            interaction.client.music_queue.set(voiceChannel.guild.id, queue);

            // Check if the player is already playing
            if (queue.length === 1) {
                playSong(interaction, voiceChannel, queue); // Start playback if this is the only song in the queue
            } else {
                await interaction.followUp(`Enqueued: **${songTitle}** by **${songArtist}** (${songDuration})`);
            }
        } catch (error) {
            console.error('Error executing the play command:', error);
            await interaction.followUp('Failed to play the song. Please try again.');
        }
    }
};

async function playSong(interaction, voiceChannel, queue) {
    // Get the stored voice channel for this guild
    const storedVoiceChannel = interaction.client.voiceChannels?.get(voiceChannel.guild.id);
    if (storedVoiceChannel) {
        voiceChannel = storedVoiceChannel;
    }
    else {
        // Store the voice channel for future use
        interaction.client.voiceChannels?.set(voiceChannel.guild.id, voiceChannel);
    }
    const song = queue[0]; // Get the first song in the queue

    const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    const player = createAudioPlayer();
    connection.subscribe(player);

    console.log('Playing:', song.title);
    console.log('Queue:', queue)

    player.stop(); // Stop the current song before playing the new one

    const stream = await playdl.stream(song.url);

    const resource = createAudioResource(stream.stream, { 
        inputType: stream.type
    });
    
    try {
        player.play(resource);
    } catch (error) {
        console.error('Error playing the song:', error);
        await interaction.followUp('Failed to play the song. Please try again.');
        queue.shift(); // Remove the song that caused the error
        if (queue.length > 0) playSong(interaction, voiceChannel, queue); // Play next song if available
    }


    player.on('error', error => {
        //console.error('Player error:', error);
        interaction.followUp('Playback error encountered. Please try again.');
        queue.shift(); // Remove the song that caused the error
        if (queue.length > 0) playSong(interaction, voiceChannel, queue); // Play next song if available
    });

    await entersState(player, AudioPlayerStatus.Playing, 5000);
    await interaction.followUp(`Now playing: **${song.title}** by **${song.artist}** (${song.duration}) in ${voiceChannel.name}!`);

    player.on(AudioPlayerStatus.Idle, () => {
        queue.shift(); // Remove the song that just finished
        if (queue.length > 0) {
            playSong(interaction, voiceChannel, queue); // Play the next song in the queue
        } else {
            connection.destroy(); // Disconnect the bot from the channel if no more songs are left
        }
    });
}

module.exports.playSong = playSong;

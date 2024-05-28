const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, entersState, StreamType, AudioPlayerStatus } = require('@discordjs/voice');
const playdl = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('music')
        .setDescription('Music related commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('play')
                .setDescription('Plays a song in a voice channel.')
                .addStringOption(option =>
                    option.setName('keyword-or-url')
                        .setDescription('The URL of the song to play or keywords to search')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('queue')
                .setDescription('Displays the current music queue.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('skip')
                .setDescription('Skips the current song in the queue.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stop')
                .setDescription('Stops the music, clears the queue, and disconnects the bot.')
        ),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'play') {
            await this.play(interaction);
        } else if (subcommand === 'queue') {
            await this.queue(interaction);
        } else if (subcommand === 'skip') {
            await this.skip(interaction);
        } else if (subcommand === 'stop') {
            await this.stop(interaction);
        } else {
            await interaction.reply('Invalid subcommand provided.');
        }
    },
    async play(interaction) {
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
    },
    async queue(interaction) {
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
    },
    async skip(interaction) {
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
    },
    async stop(interaction) {
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
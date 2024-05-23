const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

// Store the ongoing tournament in a variable
let ongoingTournament = null;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chess')
        .setDescription('Chess related commands')
        .addSubcommand(subcommand =>
            subcommand
                .setName('analyze')
                .setDescription('Analyzes a given FEN string and suggests the best move.')
                .addStringOption(option =>
                    option.setName('fen')
                        .setDescription('Board FEN')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('create-tournament')
                .setDescription('Creates a new chess tournament.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('join-tournament')
                .setDescription('Joins the ongoing chess tournament.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('view-tournament')
                .setDescription('Views the current tournament brackets.')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('update-tournament')
                .setDescription('Updates the tournament by moving up winners.')
                .addStringOption(option =>
                    option.setName('winners')
                        .setDescription('The winners of the current round, separated by commas.')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'analyze') {
            const fen = interaction.options.getString('fen');

            const stm = fen.split(' ')[1] === 'w' ? 'white' : 'black';

            // Generate the Lichess analysis URL
            const analysisUrl = `https://lichess.org/analysis/standard/${encodeURIComponent(fen)}`;

            // Generate the Lichess FEN image URL
            const imageUrl = `https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(fen)}&color=${stm}`;

            // Reply with the FEN string, Lichess analysis link, and FEN image link
            await interaction.reply(
                `\`\`\`${fen}\`\`\` [Lichess Analysis Link](${analysisUrl}) | ![Image](${imageUrl})`
            );
        } else if (interaction.options.getSubcommand() === 'create-tournament') {
            if (ongoingTournament) {
                await interaction.reply('A tournament is already ongoing.');
                return;
            }

            ongoingTournament = {
                players: [],
                started: false,
            };

            await interaction.reply('Tournament created successfully! Players can now join the tournament using the `/chess join-tournament` command.');
        } else if (interaction.options.getSubcommand() === 'join-tournament') {
            if (!ongoingTournament) {
                await interaction.reply('No tournament is currently ongoing.');
                return;
            }

            if (ongoingTournament.started) {
                await interaction.reply('This tournament has already started.');
                return;
            }

            const username = interaction.user.username;
            if (ongoingTournament.players.includes(username)) {
                await interaction.reply('You are already participating in this tournament.');
                return;
            }

            ongoingTournament.players.push(username);

            await interaction.reply(`You have successfully joined the tournament! There are now ${ongoingTournament.players.length} players participating.`);
        } else if (interaction.options.getSubcommand() === 'view-tournament') {
            if (!ongoingTournament) {
                await interaction.reply('No tournament is currently ongoing.');
                return;
            }

            const bracket = generateBracket(ongoingTournament.players);
            const bracketMessage = generateBracketMessage(bracket);

            await interaction.reply(bracketMessage);
        } else if (interaction.options.getSubcommand() === 'update-tournament') {
            if (!ongoingTournament) {
                await interaction.reply('No tournament is currently ongoing.');
                return;
            }

            if (!ongoingTournament.started) {
                await interaction.reply('This tournament has not started yet.');
                return;
            }

            const winners = interaction.options.getString('winners').split(',');
            ongoingTournament.players = winners;

            await interaction.reply('Tournament updated successfully!');
        }
    },
};

// Function to generate the tournament bracket
function generateBracket(players) {
    const bracket = [];

    // Generate a random pairing for each round
    while (players.length > 1) {
        const round = [];
        for (let i = 0; i < players.length / 2; i++) {
            const player1 = players.splice(Math.floor(Math.random() * players.length), 1)[0];
            const player2 = players.splice(Math.floor(Math.random() * players.length), 1)[0];
            round.push([player1, player2]);
        }
        bracket.push(round);
    }

    return bracket;
}

// Function to generate the bracket message
function generateBracketMessage(bracket) {
    let message = '';

    for (let i = 0; i < bracket.length; i++) {
        message += `**Round ${i + 1}**\n`;
        for (let j = 0; j < bracket[i].length; j++) {
            const match = bracket[i][j];
            message += `${match[0]} vs ${match[1]}\n`;
        }
        message += '\n';
    }

    return message;
}
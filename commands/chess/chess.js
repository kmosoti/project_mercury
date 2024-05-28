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
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'analyze') {
            await this.analyzeFen(interaction);
        } else if (subcommand === 'create-tournament') {
            await this.createTournament(interaction);
        } else if (subcommand === 'join-tournament') {
            await this.joinTournament(interaction);
        } else if (subcommand === 'view-tournament') {
            await this.viewTournament(interaction);
        } else if (subcommand === 'update-tournament') {
            await this.updateTournament(interaction);
        }
    },
    async analyzeFen(interaction) {
        try {
            const fen = interaction.options.getString('fen');

            const sideToMove = fen.split(' ')[1] === 'w' ? 'white' : 'black';

            // Generate the Lichess analysis URL
            const analysisUrl = `https://lichess.org/analysis/standard/${encodeURIComponent(fen)}`;

            // Generate the Lichess FEN image URL
            const imageUrl = `https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(fen)}&color=${sideToMove}`;

            // Reply with the FEN string, Lichess analysis link, and FEN image link
            await interaction.reply(
                `\`\`\`${fen}\`\`\` [Lichess Analysis Link](${analysisUrl}) | ![Image](${imageUrl})`
            );
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while analyzing the FEN.');
        }
    },
    async createTournament(interaction) {
        try {
            if (ongoingTournament) {
                await interaction.reply('A tournament is already ongoing.');
                return;
            }

            ongoingTournament = {
                players: [],
                started: false,
            };

            await interaction.reply('Tournament created successfully! Players can now join the tournament using the `/chess join-tournament` command.');
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while creating the tournament.');
        }
    },
    async joinTournament(interaction) {
        try {
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
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while joining the tournament.');
        }
    },
    async viewTournament(interaction) {
        try {
            if (!ongoingTournament) {
                await interaction.reply('No tournament is currently ongoing.');
                return;
            }
    
            const bracket = this.generateTournamentBracket(ongoingTournament.players);
            const bracketMessage = this.generateTournamentBracketMessage(bracket);
    
            if (bracketMessage.trim() === '') {
                await interaction.reply('There are no matches to display yet.');
            } else {
                await interaction.reply(bracketMessage);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while viewing the tournament.');
        }
    },
    async updateTournament(interaction) {
        try {
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
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while updating the tournament.');
        }
    },
    generateTournamentBracket(players) {
        if (players.length === 1) {
            return [[players[0], 'Awaiting Opponent']];
        }
    
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
    },
    generateTournamentBracketMessage(bracket) {
        let message = '';
    
        for (let i = 0; i < bracket.length; i++) {
            message += `**Round ${i + 1}**\n`;
            for (let j = 0; j < bracket[i].length; j++) {
                const match = bracket[i][j];
                if (match[1] === 'Awaiting Opponent') {
                    message += `${match[0]} (awaiting opponent)\n`;
                } else {
                    message += `${match[0]} vs ${match[1]}\n`;
                }
            }
            message += '\n';
        }
    
        return message;
    },
};
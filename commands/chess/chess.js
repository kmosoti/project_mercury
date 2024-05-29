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

        switch (subcommand) {
            case 'analyze':
                await this.analyzeFen(interaction);
                break;
            case 'create-tournament':
                await this.createTournament(interaction);
                break;
            case 'join-tournament':
                await this.joinTournament(interaction);
                break;
            case 'view-tournament':
                await this.viewTournament(interaction);
                break;
            case 'update-tournament':
                await this.updateTournament(interaction);
                break;
            default:
                await interaction.reply('Invalid subcommand provided.');
                break;
        }
    },
    async analyzeFen(interaction) {
        try {
            const fen = interaction.options.getString('fen');
            const sideToMove = fen.split(' ')[1] === 'w' ? 'white' : 'black';
            const analysisUrl = `https://lichess.org/analysis/standard/${encodeURIComponent(fen)}`;
            const imageUrl = `https://lichess1.org/export/fen.gif?fen=${encodeURIComponent(fen)}&color=${sideToMove}`;

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
                players: ["Player 1", "The Bot", "Chess Master", "Grandmaster", "Leroy"],
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
    
            await interaction.reply(bracketMessage.trim() ? bracketMessage : 'There are no matches to display yet.');
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

            const winners = interaction.options.getString('winners').split(',').map(winner => winner.trim());
            ongoingTournament.players = winners;

            ongoingTournament.rounds = this.generateTournamentBracket(winners);

            await interaction.reply('Tournament updated successfully! Use `/chess view-tournament` to see the updated brackets.');
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while updating the tournament.');
        }
    },
    generateTournamentBracket(players) {
        const rounds = [];
        let currentPlayers = [...players];

        while (currentPlayers.length > 1) {
            const round = [];
            while (currentPlayers.length > 1) {
                const player1 = currentPlayers.shift();
                const player2 = currentPlayers.length > 0 ? currentPlayers.shift() : 'BYE';
                round.push([player1, player2]);
            }
            rounds.push(round);
            currentPlayers = round.map(match => match[1] === 'BYE' ? match[0] : match[0]);
        }

        return rounds;
    },
    generateTournamentBracketMessage(bracket) {
        return bracket.map((round, i) => 
            `**Round ${i + 1}**\n` + 
            round.map(match => match[1] === 'BYE' ? `${match[0]} (advances automatically)` : `${match[0]} vs ${match[1]}`).join('\n') + 
            '\n'
        ).join('\n');
    },
};

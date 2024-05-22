const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chess')
        .setDescription('Suggests the best move for a given FEN string.')
        .addStringOption(option =>
            option.setName('fen')
                .setDescription('The FEN string of the current game.')
                .setRequired(true)),
    async execute(interaction) {
        const fen = interaction.options.getString('fen');

        axios.get(`https://stockfish.online/api/analysis?fen=${fen}&depth=10`)
            .then(response => {
                if (response.data.success) {
                    const bestMove = response.data.bestmove.split(' ')[1];
                    interaction.reply(`The best move is: ${bestMove}`);
                } else {
                    interaction.reply(`Error: ${response.data.error}`);
                }
            })
            .catch(error => {
                interaction.reply(`An error occurred: ${error.message}`);
            });
    }
};
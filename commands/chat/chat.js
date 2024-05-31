const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { OpenAI } = require('openai');

require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Create a Map to store user attempts
const userAttempts = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat related commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('ask')
        .setDescription('Ask the AI a question')
        .addStringOption(option =>
          option.setName('question')
            .setDescription('The question to ask the AI')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('story')
        .setDescription('Generate a story')
        .addStringOption(option =>
          option.setName('prompt')
            .setDescription('The prompt for the story')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('image')
        .setDescription('Generate an image')
        .addStringOption(option =>
          option.setName('prompt')
            .setDescription('The prompt for the image')
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'ask') {
      await this.ask(interaction);
    } else if (subcommand === 'story') {
      await this.story(interaction);
    } else if (subcommand === 'image') {
      await this.image(interaction);
    } else {
      await interaction.reply('Invalid subcommand provided.');
    }
  },
  async ask(interaction) {
    const question = interaction.options.getString('question');
    const userId = interaction.user.id;

    // Check if the user has made attempts before
    if (!userAttempts.has(userId)) {
      userAttempts.set(userId, { ask: 0, story: 0, image: 0 });
    }

    const attempts = userAttempts.get(userId);

    // Check if the user has reached the limit
    if (attempts.ask >= 20) {
      await interaction.reply('You have reached the limit of 20 attempts for the ask command.');
      return;
    }

    attempts.ask++;
    userAttempts.set(userId, attempts);

    await interaction.deferReply();
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: question }],
      });
      await interaction.editReply(response.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error generating completion:', error);
      await interaction.editReply('There was an error processing your request.');
    }
  },
  async story(interaction) {
    const prompt = interaction.options.getString('prompt');
    const userId = interaction.user.id;

    // Check if the user has made attempts before
    if (!userAttempts.has(userId)) {
      userAttempts.set(userId, { ask: 0, story: 0, image: 0 });
    }

    const attempts = userAttempts.get(userId);

    // Check if the user has reached the limit
    if (attempts.story >= 5) {
      await interaction.reply('You have reached the limit of 5 attempts for the story command.');
      return;
    }

    attempts.story++;
    userAttempts.set(userId, attempts);

    await interaction.deferReply();
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
      });
      await interaction.editReply(response.choices[0].message.content.trim());
    } catch (error) {
      console.error('Error generating completion:', error);
      await interaction.editReply('There was an error processing your request.');
    }
  },
  async image(interaction) {
    const prompt = interaction.options.getString('prompt');
    const userId = interaction.user.id;

    // Check if the user has made attempts before
    if (!userAttempts.has(userId)) {
      userAttempts.set(userId, { ask: 0, story: 0, image: 0 });
    }

    const attempts = userAttempts.get(userId);

    // Check if the user has reached the limit
    if (attempts.image >= 5) {
      await interaction.reply('You have reached the limit of 5 attempts for the image command.');
      return;
    }

    attempts.image++;
    userAttempts.set(userId, attempts);

    await interaction.deferReply();
    try {
      const response = await openai.images.generate({
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      });
      const imageUrl = response.data[0].url;

      const embed = new EmbedBuilder()
        .setTitle('Generated Image')
        .setDescription(`Here is your image, ${interaction.user.username}`)
        .setImage(imageUrl)
        .setTimestamp();

      await interaction.editReply({ content: `<@${interaction.user.id}>`, embeds: [embed] });
    } catch (error) {
      console.error('Error generating image:', error.error.message);

      let errorMessage = 'There was an error processing your request.';
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }

      await interaction.editReply({ content: `<@${interaction.user.id}> ${errorMessage}` });
    }
  },
};
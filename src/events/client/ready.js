module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
        //log that the bot is ready
        console.log(`Logged in as ${client.user.tag}!`);
    }
}
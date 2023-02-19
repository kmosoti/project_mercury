const fs = require('fs');

module.exports = (client) => {
    client.handleEvents = async () => {
        //get the events folder
        const event_folders = fs.readdirSync('./src/events');
        //loop through each folder and get the files
        for (const folder of event_folders) {
            const event_files = fs
                .readdirSync(`./src/events/${folder}`)
                .filter(file => file.endsWith('.js'));
            //Switch case that will handle the events based on the folder name
            switch (folder) {
                case 'client':
                    //loop through each file and add the event to the client
                    for (const file of event_files) {
                        //console.log(`../../events/${folder}/${file}`)
                        const event = require(`../../events/${folder}/${file}`);
                        if(event.once) {
                            client.once(event.name, (...args) => event.execute(...args, client));
                        } else {
                            client.on(event.name, (...args) => event.execute(...args, client));
                        }
                    }
                    break;
                default:
                    break;
            }
        }
    }
}
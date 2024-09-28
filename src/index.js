const { Client, GatewayIntentBits, Partials } = require(`discord.js`);
const client = new Client({ intents: ['GuildMessages', 'MessageContent', 'DirectMessages', 'GuildMembers', 'Guilds'], }); //Guilds, GuildMembers : REQUIRED 
const chalk = require('chalk');
const config = require('../config.json');
const { eventsHandler } = require('./functions/handlers/handelEvents');
const path = require('path');
const { checkMissingIntents } = require('./functions/handlers/requiredIntents');
const { antiCrash } = require('./functions/handlers/antiCrash');
antiCrash();

const eventsPath = './events';

(async () => {
    try {
        await client.login(config.bot.token);
        console.log(chalk.green.bold('SUCCESS: ') + 'Bot logged in successfully!');
        await eventsHandler(client, path.join(__dirname, eventsPath));
        checkMissingIntents(client);
    } catch (error) {
        if (error.message === "An invalid token was provided.") {
            console.error(chalk.red.bold('ERROR: ') + 'The token provided for the Discord bot is invalid. Please check your configuration.');
        } else {
            console.error(chalk.red.bold('ERROR: ') + 'Failed to log in:', error);
        }
    }
})();


// You can start writing your custom bot logic from here. Add new features, commands, or events!

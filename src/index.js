const { Client, GatewayIntentBits, Partials } = require(`discord.js`);
const client = new Client({ intents: ['GuildMessages', 'MessageContent', 'DirectMessages', 'GuildMembers', 'Guilds'], }); //Guilds, GuildMembers : REQUIRED 
const chalk = require('chalk');
const config = require('../config.json');
const fs = require('fs');
const { eventsHandler } = require('./functions/handlers/handelEvents');
const path = require('path');
const { checkMissingIntents } = require('./functions/handlers/requiredIntents');
const { antiCrash } = require('./functions/handlers/antiCrash');
antiCrash();
require('./functions/handlers/watchFolders');
const adminFolderPath = path.join(__dirname, '../admin');
const dashboardFilePath = path.join(adminFolderPath, 'dashboard.js');

const eventsPath = './events';

const errorsDir = path.join(__dirname, '../../../errors');

function ensureErrorDirectoryExists() {
    if (!fs.existsSync(errorsDir)) {
        fs.mkdirSync(errorsDir);
    }
}

function logErrorToFile(error) {
    ensureErrorDirectoryExists();

    // Convert the error object into a string, including the stack trace
    const errorMessage = `${error.name}: ${error.message}\n${error.stack}`;

    const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
    const filePath = path.join(errorsDir, fileName);

    fs.writeFileSync(filePath, errorMessage, 'utf8');
}


(async () => {
    try {
        await client.login(config.bot.token);
        console.log(chalk.green.bold('SUCCESS: ') + 'Bot logged in successfully!');
        if (fs.existsSync(adminFolderPath) && fs.existsSync(dashboardFilePath)) {
            require(dashboardFilePath);
            console.log(chalk.green(chalk.green.bold('SUCCESS: Admin dashboard loaded successfully!.')));

        }
        require('./functions/handlers/functionHandler');

        await eventsHandler(client, path.join(__dirname, eventsPath));
        checkMissingIntents(client);
    } catch (error) {
        if (error.message === "An invalid token was provided.") {
            console.error(chalk.red.bold('ERROR: ') + 'The token provided for the Discord bot is invalid. Please check your configuration.');
            logErrorToFile(error)
        } else {
            console.error(chalk.red.bold('ERROR: ') + 'Failed to log in:', error);
            logErrorToFile(error)
        }
    }
})();

module.exports = client;



//* You can start writing your custom bot logic from here. Add new features, commands, or events!

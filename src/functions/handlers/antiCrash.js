const axios = require('axios');
const config = require('../../../config.json');
const chalk = require('chalk');
const process = require('node:process');

function antiCrash() {
    const webhookURL = config.logging.errorLogs;

    async function sendErrorNotification(message) {
        if (!webhookURL || webhookURL === "YOUR_DISCORD_WEBHOOK_URL") {
            console.warn(chalk.yellow.bold('WARNING:') + ' No valid webhook URL provided. Unable to send error notifications.');
            return;
        }

        const embed = {
            title: "Error Notification",
            description: message,
            color: 0xff0000,
            timestamp: new Date(),
            footer: {
                text: "Bot Error Logger",
            },
        };

        await axios.post(webhookURL, { embeds: [embed] })
            .catch(error => {
                console.warn(chalk.yellow.bold('WARNING:') + ' Failed to send error notification:', error.message);
            });
    }

    process.on('unhandledRejection', async (reason, promise) => {
        const errorMessage = reason.message.includes("Used disallowed intents")
            ? 'Used disallowed intents. Please check your bot settings on the Discord developer portal.'
            : `Unhandled Rejection at: ${promise} \nReason: ${reason} \nStack: ${reason.stack || 'No stack trace available.'}`;

        console.error(chalk.red.bold('ERROR:') + ' ' + errorMessage);
        await sendErrorNotification(errorMessage);
    });
    process.on('uncaughtException', async (error) => {
        const errorMessage = error.message.includes("Used disallowed intents")
            ? 'Used disallowed intents. Please check your bot settings on the Discord developer portal.'
            : `Uncaught Exception: ${error.message} \nStack: ${error.stack || 'No stack trace available.'}`;

        console.error(chalk.red.bold('ERROR:') + ' ' + errorMessage);
        await sendErrorNotification(errorMessage);
    });
}

module.exports = { antiCrash };

const axios = require('axios');
const config = require('../../../config.json');
const chalk = require('chalk');
const process = require('node:process');
const fs = require('fs');
const path = require('path');

function antiCrash() {
    const webhookURL = config.logging.errorLogs;
    const errorsDir = path.join(__dirname, '../../../errors');

    function ensureErrorDirectoryExists() {
        if (!fs.existsSync(errorsDir)) {
            fs.mkdirSync(errorsDir);
        }
    }

    function logErrorToFile(error) {
        try {
            // Check if error logging is enabled in discobase.json
            const discobasePath = path.join(__dirname, '../../../discobase.json');
            if (fs.existsSync(discobasePath)) {
                const discobaseConfig = JSON.parse(fs.readFileSync(discobasePath, 'utf8'));
                if (discobaseConfig.errorLogging && discobaseConfig.errorLogging.enabled === false) {
                    // Error logging is disabled, do nothing
                    return;
                }
            }
            
            ensureErrorDirectoryExists();

            const errorMessage = typeof error === 'string' ? error : `${error.name}: ${error.message}\n${error.stack}`;
            const fileName = `${new Date().toISOString().replace(/:/g, '-')}.txt`;
            const filePath = path.join(errorsDir, fileName);

            fs.writeFileSync(filePath, errorMessage, 'utf8');
        } catch (err) {
            // If there's an error while logging the error, just silently fail
            // We don't want errors in error logging to cause more issues
        }
    }

    async function sendErrorNotification(message) {
        if (!webhookURL || webhookURL === "YOUR_DISCORD_WEBHOOK_URL") {
            const timestamp = chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`);
            console.warn(`${timestamp}${chalk.yellow.bold(' ⚠ WARNING ')}${chalk.white(' │ ')}No valid webhook URL provided. Unable to send error notifications.`);
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

        await axios.post(webhookURL, { embeds: [embed] }).catch(error => {
            const timestamp = chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`);
            console.warn(`${timestamp}${chalk.yellow.bold(' ⚠ WARNING ')}${chalk.white(' │ ')}Failed to send error notification: ${error.message}`);
        });
    }

    function logError(message) {
        const timestamp = chalk.gray(`[${new Date().toLocaleTimeString([], { hour12: true })}]`);
        console.error(`${timestamp}${chalk.red.bold(' ✖ ERROR ')}${chalk.white(' │ ')}${chalk.red(message)}`);
    }

    process.on('unhandledRejection', async (reason, promise) => {
        const errorMessage = reason?.message?.includes("Used disallowed intents")
            ? 'Used disallowed intents. Please check your bot settings on the Discord developer portal.'
            : `Unhandled Rejection at: ${promise} \nReason: ${reason} \nStack: ${reason?.stack || 'No stack trace available.'}`;

        logError(errorMessage);
        logErrorToFile(errorMessage);
        await sendErrorNotification(errorMessage);
    });

    process.on('uncaughtException', async (error) => {
        const errorMessage = error?.message?.includes("Used disallowed intents")
            ? 'Used disallowed intents. Please check your bot settings on the Discord developer portal.'
            : `Uncaught Exception: ${error.message} \nStack: ${error.stack || 'No stack trace available.'}`;

        logError(errorMessage);
        logErrorToFile(errorMessage);
        await sendErrorNotification(errorMessage);
    });
}

module.exports = { antiCrash };

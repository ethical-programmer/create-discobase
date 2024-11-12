
![Logo](https://i.ibb.co/HDKDpny/Add-a-heading-1.png)

<div align="center">

![Discord](https://img.shields.io/discord/1188398653530984539?logo=discord&logoColor=%23fff&logoSize=auto&label=Discord&labelColor=%23505050&color=%235E6AE9&link=https%3A%2F%2Fdiscord.gg%2Fethical-programmer-s-1188398653530984539) ![NPM Version](https://img.shields.io/npm/v/create-discobase?logo=npm&label=npm&labelColor=%235C5C5C&color=%23F58142) ![NPM License](https://img.shields.io/npm/l/create-discobase) ![NPM Downloads](https://img.shields.io/npm/dw/create-discobase)

</div>



# discoBase

**discoBase** is a lightweight command and event handler package for Discord bots, enabling easy management of commands and events with a structured file organization and dynamic loading system. It allows you to build almost any advanced Discord bot effortlessly.

```
✨ Supports Latest Discord.js v14.
```

## 🎉 New Update (v2.0.0) 🎉
- 🚀 Enhanced Terminal Look: Experience a cleaner and more modern terminal display with colorful logs for success, errors, and info messages.
- 📝 Auto-Generated Files: Commands, events, and prefix commands now come with pre-built templates to save you time.
- ⚡ Optimized File Watching: Automatic detection and template insertion for new command, event, and prefix files.
- 🔍 **Error Logging:** Errors encountered during runtime are automatically logged into an `errors` folder for easier debugging.
- 📊 **Discobase Dashboard:** A comprehensive dashboard running on localhost allows you to:
  - View statistics such as bot guilds, command counts, and user counts.
  - Monitor recent activities (e.g., command creation, deletion, and changes).
  - Manage bot settings like banner, avatar, and name directly from the dashboard.


## Features

- 🎉 Command Handler
- 📅 Event Handler
- ⚙️ Advanced Customization
- 🚀 Asynchronous Support
- 🔄 Dynamic Reloading
- 🛠️ Modular Structure
- 🛡 Never Crash
- 🌐 Compatibility with Advanced Discord Bots
- 🔤 Prefix Commands Support
- ➗ Slash Commands Support
- 🔔 Automatic Detection of Missing Intents
- ⚙️ **Configurable Function Execution:** Allows for setting properties such as `once`, `interval`, `retryAttempts`, `maxExecution`, and `initializer` in your functions to control execution patterns. Ideal for scheduling tasks or retrying operations with ease.
- 🗂️ **Error Logging:** Automatic logging of runtime errors into an `errors` folder.
- 📊 **Discobase Dashboard:** View and manage your bot's statistics and settings easily.
- 🔧 **Discobase Generate Command:** Generate new commands and events with ease. For example:
run this in your terminal after setuping discobase!
 ```bash
  npm run generate 
```

## Installation

To create a new **discoBase** project, run the following commands:


```bash
npx create-discobase@latest my-project
```

You can also create a new project in the current directory without specifying a project name:

```bash
npx create-discobase@latest
```
This will generate a new **discoBase** project in the current directory.

## Useful Addon
- [Discobase](https://www.npmjs.com/package/discobase)

    
## Configuration

To run this project, you will need to provide the necessary values in the config.json file located in the root directory. The structure of the file is as follows:


| Parameter                      | Type     | Description                                                  |
| :------------------------------| :------- | :----------------------------------------------------------- |
| `bot.token`                    | `string` | **Required**. Your Discord bot token                          |
| `bot.id`                       | `string` | **Required**. The ID of your Discord bot                      |
| `bot.admins`                   | `array`  | **Optional**. List of admin user IDs                          |
| `bot.ownerId`                  | `string` | **Optional**. The owner's user ID                             |
| `bot.developerCommandsServerIds`| `array`  | **Optional**. Server IDs where developer commands are enabled |
| `database.mongodbUrl`          | `string` | **Optional**. MongoDB connection URL                          |
| `logging.guildJoinLogsId`       | `string` | **Optional**. Channel ID for guild join logs                  |
| `logging.guildLeaveLogsId`      | `string` | **Optional**. Channel ID for guild leave logs                 |
| `logging.commandLogsChannelId`  | `string` | **Optional**. Channel ID for command logs                     |
| `logging.errorLogs`            | `string` | **Optional**. Webhook URL for error logging                   |
| `prefix.value`                 | `string` | **Optional**. Command prefix for non-slash commands           |



## Command Options

| Option              | Type        | Description                                                                                          |
| :------------------ | :---------- | :--------------------------------------------------------------------------------------------------- |
| `ownerOnly`         | `boolean`   | **Optional**. If `true`, the command can only be run by the bot owner.                                |
| `adminOnly`         | `boolean`   | **Optional**. If `true`, the command can only be used by bot admins specified in the config file.      |
| `devOnly`           | `boolean`   | **Optional**. If `true`, the command is only registered/run in specific developer servers. |
| `botPermissions`    | `array`     | **Optional**. List of permissions the bot needs to execute the command (e.g., `'SendMessages'`, `'ManageChannels'`). |
| `userPermissions`   | `array`     | **Optional**. List of permissions the user needs to execute the command (e.g., `'Administrator'`, `'KickMembers'`). |
| `cooldown`          | `number`    | **Optional**. The cooldown time in seconds before the command can be reused. Default is 3 seconds.    |


## Function Options
| Property         | Type       | Description                                                                                          |
|------------------|------------|------------------------------------------------------------------------------------------------------|
| `once`           | `boolean`  | If `true`, the function will only execute once. If `false`, it can be executed repeatedly.           |
| `interval`       | `number`   | The time interval (in milliseconds) between repeated executions of the function.                     |
| `retryAttempts`  | `number`   | Specifies the number of retry attempts if the function fails during execution.                       |
| `maxExecution`   | `number`   | Defines the maximum number of times the function can execute.                                        |
| `initializer`    | `number`   | Initial value or state to use when starting the function; can be used for setup or as a counter.     |

```js
const exampleFunction = async () => {
    console.log("Function executed successfully.");
};

exampleFunction.config = {
    once: true,           
    interval: 10000,      
    retryAttempts: 3,     
    maxExecution: 5,     
    initializer: 10       
};

module.exports = exampleFunction;

```


## Contributing

Contributions are always welcome!

See `contributing.md` for ways to get started.

Please adhere to this project's `code of conduct`.


## Show your support

Give a ⭐️ if this project helped you!

<a href="https://www.patreon.com/EthicalProgrammer">
  <img src="https://c5.patreon.com/external/logo/become_a_patron_button@2x.png" width="160">
</a>

## Feedback & Suggestion

If you have any feedback or suggestion, please reach out to us at [Discord Community](https://discord.gg/ethical-programmer-s-1188398653530984539)


## Support

For support & questions, join our Discord server: [Discord Community](https://discord.gg/ethical-programmer-s-1188398653530984539).

![Logo](https://i.ibb.co/HDKDpny/Add-a-heading-1.png)

<div align="center">

![Discord](https://img.shields.io/discord/1188398653530984539?logo=discord&logoColor=%23fff&logoSize=auto&label=Discord&labelColor=%23505050&color=%235E6AE9&link=https%3A%2F%2Fdiscord.gg%2Fethical-programmer-s-1188398653530984539) ![NPM Version](https://img.shields.io/npm/v/create-discobase?logo=npm&label=npm&labelColor=%235C5C5C&color=%23F58142) ![NPM License](https://img.shields.io/npm/l/create-discobase)
</div>



# discoBase

**discoBase** is a lightweight command and event handler package for Discord bots, enabling easy management of commands and events with a structured file organization and dynamic loading system. It allows you to build almost any advanced Discord bot effortlessly.

```
✨ Supports Latest Discord.js v14.
```
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


## Installation

To create a new **discoBase** project, run the following commands:


```bash
npx create-discobase my-project
```

You can also create a new project in the current directory without specifying a project name:

```bash
npx create-discobase
```
This will generate a new **discoBase** project in the current directory.


    
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

## Authors

- [@ethical_dev](https://discord.com/users/740117727322046538)


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

For support & questions, join our Discord server: Join our [Discord Community](https://discord.gg/ethical-programmer-s-1188398653530984539).
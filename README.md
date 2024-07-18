# Project Mercury

**Discord bot for personal preferences**

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Commands](#commands)
- [Hosting](#hosting)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Introduction

Project Mercury is a customizable Discord bot designed to cater to specific personal preferences. It includes features such as music playback, AI-powered chat responses, and chess tournaments.

## Features

- **Music Playback:** Play high-quality music from various sources.
- **AI Chat Responses:** Engage in conversations with AI-powered responses.
- **Chess Tournaments:** Organize and manage chess games.

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kmosoti/project_mercury.git
   ```
2. **Navigate to the project directory:**
   ```bash
   cd project_mercury
   ```
3. **Install the dependencies:**
   ```bash
   npm install
   ```
4. **Set up environment variables:**
   - Create a `.env` file in the root directory and add your keys.
5. **Run the bot:**
   ```bash
   node index.js
   ```

## Usage

Invite the bot to your Discord server and interact using defined commands.

## Commands

### Music Commands

- `!play <song_name>` - Play a song.
- `!pause` - Pause the current song.
- `!resume` - Resume the paused song.
- `!stop` - Stop the music playback.

### AI Chat Commands

- `!chat <message>` - Engage in a conversation with the AI-powered bot.

### Chess Commands

- `!startchess` - Start a new chess game.
- `!move <move>` - Make a move in the ongoing chess game.
- `!status` - Check the status of the current game.

## Hosting

To keep the bot running 24/7, you can host it on a cloud service. In my case, I used AWS Lightsail successfully by running it as a PM2 process.

### Steps to Host on AWS Lightsail

1. **Create a Lightsail Instance:**
   - Log in to your AWS account and navigate to Lightsail.
   - Create a new instance with the desired configuration.

2. **SSH into the Instance:**
   - Use the provided SSH key or the Lightsail console to access your instance.

3. **Clone the Repository on the Instance:**
   ```bash
   git clone https://github.com/kmosoti/project_mercury.git
   cd project_mercury
   ```

4. **Install Dependencies:**
   ```bash
   npm install
   ```

5. **Set Up Environment Variables:**
   - Create a `.env` file and add your keys.

6. **Install PM2:**
   ```bash
   npm install pm2 -g
   ```

7. **Start the Bot with PM2:**
   ```bash
   pm2 start index.js
   pm2 save
   pm2 startup
   ```

   This ensures the bot will restart automatically if the instance reboots.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature-branch`).
6. Open a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

Kennedy R. Mosoti  
LinkedIn: [Kennedy Mosoti](https://linkedin.com/in/kennedymosoti)

# SnapScore V2

SnapScore V2 is an automation tool designed to increase your Snapchat score by automating interactions between multiple accounts.

## ⚡ Features

- Automated management of multiple Snapchat accounts
- Automatic sending and opening of snaps
- Group chat monitoring
- Flexible interaction delay configuration
- Debug mode for troubleshooting
- Maximum of 2 active sessions per Snapchat account (Snapchat limitation)

## 📥 Installation

```bash
git clone https://github.com/yourusername/SnapScore-V2.git
cd SnapScore-V2
npm install
```

## ⚙️ Configuration in index.js

```javascript
const DEBUG = false;        // Set to true for first connection
const MAIN_ACCOUNTS = 2;    // Number of main accounts
const ALT_ACCOUNTS = 7;     // Number of alternative accounts
const LATENCY_OPEN = 1000;  // Snap opening delay (ms)
const LATENCY_SEND = 1000;  // Snap sending delay (ms)
const GROUP_NAME = 'Boost'; // Discussion group name
```

## 🔑 IMPORTANT Initial Setup

1. **First Use - Debug Mode**:
   - Set `DEBUG = true`
   - Run with `npm start`
   - Manually log in to each account one by one when prompted
   - This step is required only once to save sessions

2. **Normal Use**:
   - Once all accounts are connected, set `DEBUG = false`
   - The program will then run automatically

## 🚀 Usage

```bash
npm start
```

## 📁 Structure

```
src/
├── DOM/              # DOM elements handling
├── Snapchat/         # Snapchat accounts logic
├── macros/           # Automation macros
├── scripts/          # Injection scripts
└── utils/           # Utilities
```

## ⚠️ Disclaimer

This tool is provided for educational purposes only. Using bots or automation may be against Snapchat's terms of service. Use at your own risk.

## 📝 License

MIT License
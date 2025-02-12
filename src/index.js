const { AccountManager } = require('./Snapchat/manager');

async function initializeApp() {
    console.log('Initializing SnapScore V2...');

    const DEBUG = false;
    const MAIN_ACCOUNTS = 2;
    const ALT_ACCOUNTS = 7;
    const LATENCY_OPEN = 1000;
    const LATENCY_SEND = 1000;
    const GROUP_NAME = 'Boost';

    const manager = new AccountManager(MAIN_ACCOUNTS, ALT_ACCOUNTS, DEBUG);
    await manager.connectAccounts();
    await manager.connectToGroupDiscussion(GROUP_NAME);
    manager.startObservingChat();
    await manager.startCheckingIssues(LATENCY_OPEN, LATENCY_SEND);
    manager.startLog();
}

initializeApp();

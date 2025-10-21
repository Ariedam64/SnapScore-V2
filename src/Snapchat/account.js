const path = require('path');
const os = require('os');
const { injectScript } = require("../scripts/injection");
const { focusScript } = require("../scripts/focus");
const { findFriendDiscussion, findGroupDiscussion } = require("../macros/discussion");
const { openMultipleSnaps } = require("../macros/openSnaps");
const { sendMultipleSnaps } = require("../macros/sendSnaps");
const { ElementObserverMessages, ElementObserverSent } = require("../DOM/observers");
const puppeteer = require("puppeteer");
const { SnapSelectors } = require('../DOM/selectors');
const cameraMutex = require("../utils/cameraMutex");

class Account {
    constructor(username, isMain, DEBUG = false) {
        this.username = username;
        this.isMain = isMain;
        this.visible = false;
        this.profileType = isMain ? "main" : "alt";
        this.discussion = {
            name: null,
            isGroup: null,
        }
        this.state = {
            isWorking: false,
            isBlocked: false,
            isBrowserClosed: false,
            lastSendTimestamp: null,
            totalViews: 0,
            totalSends: -1,
            totalReceived: 0,
            totalLeft: 0,
            openDuration: [],
            sendDuration: [],
        };
        this.browser = null;
        this.page = null;
        this.observers = [];
        this.userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36";
        this.DEBUG = DEBUG;
        this.userDataDir = os.platform() === 'win32' 
        ? path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data')
        : os.platform() === 'darwin' 
        ? path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'User Data')
        : path.join(os.homedir(), '.config', 'google-chrome', 'User Data');

        this.pathProfile = path.join(this.userDataDir, this.username);
    }

    async connect(){
        this.visible = this.getVisibility()
        try {
            this.browser = await puppeteer.launch({
                headless: this.visible,
                executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
                userDataDir: `${this.pathProfile}`,
                args: [
                    "--no-sandbox",
                    "--disable-setuid-sandbox",
                    "--disable-infobars",
                    "--disable-extensions",
                    "--disable-dev-shm-usage",
                    "--disable-popup-blocking",
                    "--disable-ipc-flooding-protection",
                    "--disable-popup-blocking",
                    "--disable-print-preview",
                    "--disable-prompt-on-repost",
                    ...(!this.DEBUG ? ["--disable-renderer-backgrounding"] : []),
                    ...(!this.DEBUG ? ["--disable-gl-drawing-for-tests"] : []),
                ]
            });

            // Get the first open page or create a new one
            let pages = await this.browser.pages();
            this.page = pages.length > 0 ? pages[0] : await this.browser.newPage();

            // Set user agent
            await this.page.setUserAgent(this.userAgent);

             // Navigate to Snapchat
            await this.page.goto("https://www.snapchat.com/web/", { waitUntil: "networkidle2" });

            // Wait for the page to fully load
            const pageLoaded = await this.page.waitForFunction(
                () => window.location.href === "https://www.snapchat.com/web/",
                { timeout: 30000 }
            );

            if (!pageLoaded) {
                throw new Error("Timeout: Snapchat page did not load properly.");
            }

            try {
                await this.page.waitForSelector(SnapSelectors.DISCUSSIONS_ALL, { timeout: 30000 });
            } catch (error) {
                console.log("❌ Discussions not found, refreshing page...");
                await this.page.reload({ waitUntil: "networkidle2" });
    
                await this.page.waitForSelector(SnapSelectors.DISCUSSIONS_ALL, { timeout: 30000 });
            }

            await injectScript(this.page, focusScript);
            await this.injectFunctions();

            this.state.isBrowserClosed = false;

            console.log(`✅ Profile ${this.username} connected! [${this.profileType}]`);
        }
        catch (error) {
            console.error(`❌ Error connecting ${this.username}:`, error);

            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }
        }
    }

    async disconnect() {
        try {
            this.state.isBrowserClosed = true
            this.observers = [];
            this.state.openDuration = []; 
            this.state.sendDuration = [];
            this.state.isWorking = false;
            this.state.lastSendTimestamp = null;
            if (this.browser) {
                await this.browser.close();
                this.page = null; 
                this.browser = null; 
            }
        
            console.log(`✅ ${this.username} disconnected successfully.`);
        } catch (error) {
            console.error(`❌ Error disconnecting ${this.username}:`, error);
        }
    }

    async connectToDiscussion(discussionName) {
        try {
            console.log(`🔍 Searching for discussion ${discussionName}...`);
            this.discussion.name = await findFriendDiscussion(this.page, discussionName);
            this.discussion.isGroup = false;
        } catch (error) {
            console.error(`❌ Error connecting to discussion ${discussionName}:`, error);
        }
    }

    async connectToGroupDiscussion(discussionName) {
        try {
            console.log(`🔍 ${this.username} Searching for group discussion ${discussionName}...`);
            this.discussion.name = await findGroupDiscussion(this.page, discussionName);
            this.discussion.isGroup = true;
        } catch (error) {
            console.error(`❌ Error connecting to group discussion ${discussionName}:`, error);
        }
    }

    async openMultipleSnaps() {
        try {
            if (this.browser){
                await openMultipleSnaps(this.page, this.state);
            }
        } catch (error) {
            console.error("❌ Error opening snaps:", error);
        }
    }

    async sendMultipleSnaps() {
        try {
            
            await cameraMutex.lock(); 
            
            if (this.browser){
                this.state.isWorking = true;
                await sendMultipleSnaps(this.page, this.state);
                this.state.isWorking = false;
            }
            
        } catch (error) {
            console.error("❌ sending snaps:", error);
        } finally {
            cameraMutex.unlock();
        }
    }

    async startObservingNewMessages(){
        if (this.browser){
            const observer = new ElementObserverMessages(this.page, "openMultipleSnaps" );
            observer.startObserving();
            await this.openMultipleSnaps();
            this.observers.push({name: "newMessage", observer:observer});
        }
    }

    async startObservingSentMessages(){
        if (this.browser){
            console.log("enter startObservingSentMessages")
            const observer = new ElementObserverSent(this.page, "sendMultipleSnaps" );
            observer.startObserving();
            await this.sendMultipleSnaps();
            this.observers.push({name: "sentMessage", observer:observer});
        }
    }

    async injectFunctions(){
        await this.page.exposeFunction("openMultipleSnaps", this.openMultipleSnaps.bind(this));
        await this.page.exposeFunction("sendMultipleSnaps", this.sendMultipleSnaps.bind(this));
        await this.page.exposeFunction("updateState", this.updateState.bind(this));
    }

    async updateState(newState){
        this.state = {...this.state, ...newState};
    }

    getVisibility(){
        return this.isMain ? (this.DEBUG ? false : true) : (this.DEBUG ? false : 'shell');
    }

    async logState(){
        console.group(`📊 ${this.username}`);
        console.log("🔹 is Working:", this.state.isWorking)
        console.log("🔹 is Blocked:", this.state.isBlocked)
        console.log("🔹 is Browser Closed:", this.state.isBrowserClosed)
        console.log("🔹 Total views:", this.state.totalViews)
        console.log("🔹 Total sends:", this.state.totalSends)
        console.log("🔹 Total received:", this.state.totalReceived)
        console.log("🔹 Total left:", this.state.totalLeft)
        console.log("🔹 Observers", this.observers)
        console.log("🔸 Duration average:", this.state.openDuration.reduce((a,b) => a + b, 0) / this.state.openDuration.length);
        console.groupEnd();
    }

    async restart(){
        this.state.isBrowserClosed = true
        for (const observer of this.observers) {
            await observer.observer.stopObserving();
        }
        this.observers = [];
        this.state.openDuration = [];
        this.state.isWorking = false;
        await this.disconnect();
        await this.connect();
        this.state.isBrowserClosed = false;
        if (this.discussion.isGroup) {
            await this.connectToGroupDiscussion(this.discussion.name);
        } else {    
            await this.connectToDiscussion(this.discussion.name);
        }
        if (this.isMain) {
            await this.startObservingSentMessages();
        }
        else {
            await this.startObservingNewMessages();
        }

    }
}

/**
 * Creates account instances from a given list.
 * @param {Array<string>} accountList - The list of account usernames.
 * @param {number} count - Number of instances to create (defaults to the full list).
 * @param {boolean} isMain - Indicates if the accounts are main (true) or alt (false).
 * @param {boolean} DEBUG - Enables debug mode.
 * @returns {Array<Account>} - An array of created account instances.
 */
function createAccountsFromList(accountList, count = accountList.length, isMain = false, DEBUG = false) {
    return accountList.slice(0, count).map(username => new Account(username, isMain, DEBUG));
}

module.exports = {
    Account,
    createAccountsFromList,
};
const { createAccountsFromList } = require('./account');

mainAccountsAvailable = [
    "r56rom",
    "r56rom_2",
];

altAccountsAvailable = [
    //"max.hun30", 
    "max.hun31", 
    "max.hun32", 
    "max.hun33", 
    "max.hun34", 
    "max.hun35", 
    "max.hun36", 
    "max.hun37", 
    //"max.hun38", 
    //"max.hun39",
];

class AccountManager {
    constructor(numberOfMain, numberOfAlt, DEBUG = false) {
        this.altAccounts = createAccountsFromList(altAccountsAvailable, numberOfAlt, false, DEBUG);
        this.mainAccounts = createAccountsFromList(mainAccountsAvailable, numberOfMain, true, DEBUG);
        this.discussionName = null;
        this.state = {
            startTime: Date.now(),
            elapsedTime: null,
            isBlocked: false,
            altRestarting: false,
            mainRestarting: false,
            generalRestarting: false,
            totalViews: 0,
            totalSends: 0,
            totalLeftSend: 0,
            totalLeftOpen: 0,
            openDuration: null,
            sendDuration: null,
            allSendDurations: [],
            avgViewsPerMinute: 0,
            avgSendsPerMinute: 0,
        };
        this.DEBUG = DEBUG;
    }


    async connectMainAccounts(){
        try {
            await Promise.all(this.mainAccounts.map(account => account.connect()));
        } catch (error) {
            console.error("❌ Error during main account connection:", error);
        }
    }

    async connectAltAccounts(){
        try {
            await Promise.all(this.altAccounts.map(account => account.connect()));
        } catch (error) {
            console.error("❌ Error during alt account connection:", error);
        }
    }

    async connectAccounts(){
        try {
            await this.connectAltAccounts();
            await this.connectMainAccounts();
        } catch (error) {
            console.error("❌ Error during accounts connection:", error);
        }
    }

    async connectMainsToGroupDiscussion(discussionName){
        this.discussionName = discussionName;
        try {
            await Promise.all(this.mainAccounts.map(account => account.connectToGroupDiscussion(discussionName)));
        } catch (error) {
            console.error(`❌ Error connecting main accounts to group discussion "${discussionName}":`, error);
        }
    }

    async connectAltsToGroupDiscussion(discussionName){
        this.discussionName = discussionName;
        try {
            await Promise.all(this.altAccounts.map(account => account.connectToGroupDiscussion(discussionName)));
        } catch (error) {
            console.error(`❌ Error connecting alt accounts to group discussion "${discussionName}":`, error);
        }
    }

    async connectToGroupDiscussion(discussionName) {
        try {
            await this.connectAltsToGroupDiscussion(discussionName);
            await this.connectMainsToGroupDiscussion(discussionName);
        } catch (error) {
            console.error(`❌ Error connecting to group discussion "${discussionName}":`, error);
        }
    }

    async connectMainsToDiscussion(discussionName){
        try {
            await Promise.all(this.mainAccounts.map(account => account.connectToDiscussion(discussionName)));
        } catch (error) {
            console.error(`❌ Error connecting main accounts to discussion "${discussionName}":`, error);
        }
    }

    async connectAltsToDiscussion(discussionName){
        try {
            await Promise.all(this.altAccounts.map(account => account.connectToDiscussion(discussionName)));
        } catch (error) {
            console.error(`❌ Error connecting alt accounts to discussion "${discussionName}":`, error);
        }
    }

    async connectToDiscussion(discussionName) {
        try {
            await this.connectAltsToDiscussion(discussionName);
            await this.connectMainsToDiscussion(discussionName);
        } catch (error) {
            console.error(`❌ Error connecting to discussion "${discussionName}":`, error);
        }
    }

    async startObservingChatMains() {
        try {
            await Promise.all(this.mainAccounts.map(account => account.startObservingSentMessages()));
        } catch (error) {
            console.error(`❌ Error observing chat for main accounts:`, error);
        }
    }

    async startObservingChatAlts() {
        try {
            await Promise.all(this.altAccounts.map(account => account.startObservingNewMessages()));
        } catch (error) {
            console.error(`❌ Error observing chat for alt accounts:`, error);
        }
    }

    async startObservingChat() {
        try {
            await this.startObservingChatAlts();
            await this.startObservingChatMains();
        } catch (error) {
            console.error(`❌ Error observing chat:`, error);
        }
    }

    async openMultipleSnaps() {
        try {
            const tasks = [];
            if (this.altAccounts.length > 0) {
                tasks.push(...this.altAccounts.map(account => account.openMultipleSnaps()));
            }
            await Promise.all(tasks);
        } catch (error) {
            console.error("❌ Error opening snaps:", error);
        }
    }

    async sendMultipleSnaps() {
        try {
            const tasks = [];
            if (this.mainAccounts.length > 0) {
                tasks.push(...this.mainAccounts.map(account => account.sendMultipleSnaps()));
            }
            await Promise.all(tasks);
        } catch (error) {
            console.error("❌ Error sending snaps:", error);
        }
    }

    updateState() {
        let totalViews = 0;
        let totalLeftOpen = 0;
        let totalSends = 0;
        let totalLeftSend = 0;
        let allOpenDurations = [];
        let allSendDurations = [];
        let averageOpenDuration = 0;
        let averageSendDuration = 0;

        this.altAccounts.forEach(account => {
            totalViews += account.state.totalViews;
            totalLeftOpen += account.state.totalLeft;
            allOpenDurations = allOpenDurations.concat(account.state.openDuration);
        });

        if (allOpenDurations.length > 0) {
            averageOpenDuration = allOpenDurations.reduce((sum, duration) => sum + duration, 0) / allOpenDurations.length;
        }

        this.mainAccounts.forEach(account => {
            totalSends += account.state.totalSends;
            totalLeftSend += account.state.totalLeft;
            allSendDurations = allSendDurations.concat(account.state.sendDuration);
        });

        if (allSendDurations.length > 0) {
            averageSendDuration = (allSendDurations.reduce((sum, duration) => sum + duration, 0) / allSendDurations.length) / this.mainAccounts.length;
        }

        let elapsed = Date.now() - this.state.startTime;
        let hours = Math.floor(elapsed / (1000 * 60 * 60));
        let minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((elapsed % (1000 * 60)) / 1000);

        hours = hours < 10 ? '0' + hours : hours;
        minutes = minutes < 10 ? '0' + minutes : minutes;
        seconds = seconds < 10 ? '0' + seconds : seconds;

        this.state = {
            ...this.state,
            elapsedTime: `${hours}:${minutes}:${seconds}`,
            totalViews,
            totalLeftOpen,
            totalSends,
            totalLeftSend,
            openDuration: averageOpenDuration,
            sendDuration: averageSendDuration,
            allSendDurations: allSendDurations,
            avgViewsPerMinute: totalViews / (elapsed / (1000 * 60)),
            avgSendsPerMinute: totalSends / (elapsed / (1000 * 60)),
        };
    }

    logStateAverageMains() {
        const workingMainAccounts = this.mainAccounts.filter(account => account.state.isWorking);
        const restartingState = this.state.mainRestarting ? "🔄" : "✅";
        console.group(`🔸 Main Accounts Status Details [${workingMainAccounts.length}/${this.mainAccounts.length}] ${restartingState} 🔸`);
        console.log(`- Total snaps sent: ${this.state.totalSends} (${this.state.avgSendsPerMinute.toFixed(0)}/min)`);
        console.log(`- Total snaps left to send: ${this.state.totalLeftSend}`);
        console.log(`- Average snap sending duration: ${this.state.sendDuration.toFixed(2)} ms`);
        console.groupEnd();
    }
    
    logAltAccounts() {
        const workingAltAccounts = this.altAccounts.filter(account => account.state.isWorking);
        const restartingState = this.state.altRestarting ? "🔄" : "✅";
        console.group(`🔸 Alt Accounts Status Details [${workingAltAccounts.length}/${this.altAccounts.length}] ${restartingState} 🔸`);
        console.log(`- Total snaps viewed: ${this.state.totalViews} (${this.state.avgViewsPerMinute.toFixed(0)}/min)`);
        console.log(`- Total snaps left to open: ${this.state.totalLeftOpen}`);
        console.log(`- Average snap opening duration: ${this.state.openDuration.toFixed(2)} ms`);
        console.groupEnd();
    }

    async startCheckingIssues(latencyOpen = 1250, latencySend = 1250){
        const loop = async () => {
            await this.updateState();
            await this.updateBlockedState();
            await this.updateLatencyState(latencyOpen, latencySend);
            setTimeout(loop, 500);
        };
        
        loop();
    }

    startLog(){   
        const loop = async () => {
            console.clear();
            console.log(`Launch duration: ${this.state.elapsedTime}`);
            console.log("\n");

            this.logStateAverageMains();
            console.log("\n");

            this.logAltAccounts();
            console.log("\n");


            if (this.state.isBlocked) {
                console.group("🔴 Blocked Accounts:")
                this.altAccounts.filter(account => account.state.isBlocked).forEach(account => {
                    console.log(`- ${account.username}: ${account.state.totalLeft}`);
                });
                console.groupEnd();
            }
            if (!this.state.isBlocked) {
                console.group("🟢 Unblocked Accounts");
                this.altAccounts.filter(account => !account.state.isBlocked).forEach(account => {
                    console.log(`- ${account.username}: ${account.state.totalLeft}`);
                });
                console.groupEnd();     
            }
        
            setTimeout(loop, 500);
        };
        loop();
    }

    async updateBlockedState(){

        const blockedAlts = this.altAccounts.filter(account => account.state.isBlocked);
        if (blockedAlts.length > 0 && !this.state.isBlocked) {
            this.state.mainRestarting = true;
            this.state.isBlocked = true;
            await this.disconnectMainAccounts();
        } else if (blockedAlts.length === 0 && this.state.isBlocked) {
            this.state.isBlocked = false;
            await this.connectMainAccounts();
            await this.connectMainsToGroupDiscussion(this.discussionName);
            await this.startObservingChatMains();
            this.state.mainRestarting = false;
        }
    }

    async updateLatencyState(latencyOpen, latencySend){
        if (this.state.openDuration.toFixed(2) > latencyOpen){
            await this.restartAltAccounts();
        }
        else if (this.state.sendDuration.toFixed(2) > latencySend && this.state.allSendDurations.length > 25){
            await this.restartMainAccounts();
        }
    }

    async disconnectMainAccounts(){
        await Promise.all(this.mainAccounts.map(async account => {
            if (account.browser && account.page) {
                await account.disconnect();
            }
        }));
    }

    async disconnectAltAccounts(){
        await Promise.all(this.altAccounts.map(async account => {
            if (account.browser && account.page) {
                await account.disconnect();
            }
        }));
    }

    async restartAltAccounts(){
        if (!this.state.altRestarting) {
            this.state.altRestarting = true;
            try {
                await this.disconnectAltAccounts();
                await this.connectAltAccounts();
                await this.connectAltsToGroupDiscussion(this.discussionName);
                this.startObservingChatAlts();
                this.state.altRestarting = false;
            } catch (error) {
                console.error("❌ Error restarting alt accounts:", error);
            }
        }
    }

    async restartMainAccounts(){
        if (!this.state.mainRestarting) {
            this.state.mainRestarting = true;
            try {
                await this.disconnectMainAccounts();
                await this.connectMainAccounts();
                await this.connectMainsToGroupDiscussion(this.discussionName);
                this.startObservingChatMains();
                this.state.mainRestarting = false;
            } catch (error) {
                console.error("❌ Error restarting main accounts:", error); 
            } 
        }
    }



    async restart(){
        if (!this.state.generalRestarting) {
            this.state.generalRestarting = true;
            await this.restartAltAccounts();
            await this.restartMainAccounts();
            this.state.generalRestarting = false;
        }
    }

}

module.exports = {
    AccountManager,
};
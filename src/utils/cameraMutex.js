class CameraMutex {
    constructor() {
        this.locked = false;
    }

    async lock() {
        while (this.locked) {
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        this.locked = true;
    }

    unlock() {
        this.locked = false;
    }
}

module.exports = new CameraMutex();
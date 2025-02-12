const { SnapSelectors } = require("../DOM/selectors");

async function openMultipleSnaps(page, state) { 
    if (state.isBrowserClosed) return;
    if (state.isWorking) return;

    state.isWorking = true;

    try {
        await page.evaluate(async (unreadMessageSelector, state) => {
            async function waitForSnapToBeProcessed(element) {
                return new Promise(resolve => {
                    let processed = false;
                    const snapStartTime = performance.now();

                    const observer = new MutationObserver((mutations, obs) => {
                        if (!element.classList.contains(unreadMessageSelector)) {
                            obs.disconnect();
                            processed = true;
                            const snapEndTime = performance.now();
                            const snapDuration = parseFloat((snapEndTime - snapStartTime).toFixed(2));

                            state.totalViews++;
                            state.openDuration.push(snapDuration);
                            if (state.openDuration.length > 20) {
                                state.openDuration.shift();
                            }
                            window.updateState(state);
                            resolve();
                        }
                    });

                    observer.observe(element, { attributes: true, attributeFilter: ["class"] });

                    element.click();

                    setTimeout(() => {
                        if (!processed) {
                            observer.disconnect();
                            element.click();
                            resolve();
                        }
                    }, 2000);
                });
            }

            while (true) { 
                let unreadSnaps = Array.from(document.querySelectorAll(unreadMessageSelector));
                state.totalLeft = unreadSnaps.length;

                if (unreadSnaps.length === 0 && state.isBlocked === false) {
                    break;
                }
                if (unreadSnaps.length > 25 && state.isBlocked === false) {
                    state.isBlocked = true;
                } else if (unreadSnaps.length < 10 && state.isBlocked === true) {
                    state.isBlocked = false;
                }
                
                window.updateState(state);

                for (const element of unreadSnaps) {
                    await waitForSnapToBeProcessed(element);

                    let newUnreadSnaps = Array.from(document.querySelectorAll(unreadMessageSelector));
                    if (newUnreadSnaps.length !== unreadSnaps.length) {
                        break;
                    }
                }
            }

            state.isWorking = false;
            state.totalLeft = 0;
            window.updateState(state);
        }, SnapSelectors.UNOPENED_MESSAGE, state);
    } catch (error) {
        if (error.message.includes("Target closed")) {
            console.log("Le navigateur a été fermé, arrêt de l'exécution de openMultipleSnaps.");
            return;
        } else {
            throw error;
        }
    }
}
module.exports = {
    openMultipleSnaps
};
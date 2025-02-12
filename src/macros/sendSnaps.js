const { SnapSelectors } = require("../DOM/selectors");

async function sendMultipleSnaps(page, state) {

    if (state.isBrowserClosed) {
        return;
    }

    try {
        await page.evaluate(
            async (waitingSnaps, openedSnaps, cameraButton, cameraLoaded, backCameraButton, takePictureButton, sendToButton, sendButton, state) => {
                console.log("Envoi de snaps en cours...");

                const snapToSend = 50;

                async function waitForElement(selector) {
                    return new Promise((resolve) => {
                        const element = document.querySelector(selector);
                        if (element) return resolve(element);
                
                        const observer = new MutationObserver((mutations, obs) => {
                            const el = document.querySelector(selector);
                            if (el) {
                                obs.disconnect();
                                resolve(el);
                            }
                        });
                
                        observer.observe(document.body, { childList: true, subtree: true });
                    });
                }

                const now = performance.now();
                if (state.lastSendTimestamp === null) {
                    state.lastSendTimestamp = now;
                } else {
                    const duration = now - state.lastSendTimestamp;
                    state.sendDuration.push(duration);
                    if (state.sendDuration.length > 15) {
                        state.sendDuration.shift();
                    }
                    state.lastSendTimestamp = now;
                }

                const waitingElements = Array.from(document.querySelectorAll(waitingSnaps));

                state.totalLeft = waitingElements.length;
                state.totalSends += 1;
                window.updateState(state);
                
                if (waitingElements.length > 0) { 
                    return;
                }

                state.sendDuration = [];
                state.lastSendTimestamp = null;

                const tasks = Array.from({ length: snapToSend }).map(async () => {
                    try {

                        document.querySelector(cameraButton).click();
                        await waitForElement(cameraLoaded);
                        
                        const backButton = document.querySelector(backCameraButton);
                        if (backButton) backButton.click();

                        const picButton = await waitForElement(takePictureButton);
                        picButton.click();

                        const snapSendToButton = await waitForElement(sendToButton);
                        snapSendToButton.click();
                        const snapSendButton = await waitForElement(sendButton);
                        snapSendButton.click();

                    } catch (error) {
                        console.warn("Un élément n'a pas été trouvé à temps lors de l'envoi du snap :", error);
                    }
                });

                await Promise.all(tasks);
                console.log("Tous les snaps ont été envoyés");
                state.isWorking = false;
                window.updateState(state);
            },
            SnapSelectors.WAITING_MESSAGE,
            SnapSelectors.OPENED_MESSAGE,
            SnapSelectors.CAMERA_BUTTON,
            SnapSelectors.CAMERA_LOADED,
            SnapSelectors.BACK_CAMERA_BUTTON,
            SnapSelectors.TAKE_PICTURE_BUTTON,
            SnapSelectors.SEND_TO_BUTTON,
            SnapSelectors.SEND_PICTURE_BUTTON,
            state,
        );
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
    sendMultipleSnaps
};
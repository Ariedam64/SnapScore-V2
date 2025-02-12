const { SnapSelectors } = require("./selectors");

class ElementObserver {
    /**
     * @param {object} page - La page Puppeteer
     * @param {string} elementSelector - Le sélecteur de l'élément à observer
     * @param {string} callbackName - Le nom sous lequel la fonction de callback est exposée dans le contexte de la page
     * @param {Array<string>} matchSelectors - Les sélecteurs à vérifier sur les cibles des mutations
     */
    constructor(page, elementSelector, callbackName, matchSelectors) {
      this.page = page;
      this.elementSelector = elementSelector;
      this.callbackName = callbackName;
      this.matchSelectors = matchSelectors;
    }
  
    async startObserving() {
      const elementExists = await this.page.evaluate((selector) => {
        return document.querySelector(selector) !== null;
      }, this.elementSelector);
  
      if (!elementExists) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.startObserving();
      }
  
      await this.page.evaluate(
        (elementSelector, callbackName, matchSelectors) => {
          const element = document.querySelector(elementSelector);
          if (!element) {
            console.log(`Element ${elementSelector} non trouvé !`);
            return;
          }
  
          const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
              if (matchSelectors.some(selector => mutation.target.matches(selector))) {
                if (typeof window[callbackName] === "function") {
                  window[callbackName](mutation);
                } else {
                  console.warn(`Callback ${callbackName} is not a fonction.`);
                }
              }
            });
          });
  
          observer.observe(element, { childList: true, subtree: true, attributes: true });
  
          window.__elementObserver = observer;
        },
        this.elementSelector,
        this.callbackName,
        this.matchSelectors,
      );
  
      console.log(`Observation commencée sur l'élément avec le sélecteur: ${this.elementSelector}`);
    }
  
    async stopObserving() {
      await this.page.evaluate(() => {
        if (window.__elementObserver) {
          window.__elementObserver.disconnect();
          window.__elementObserver = null;
        }
      });
      console.log(`Observation arrêtée sur l'élément avec le sélecteur: ${this.elementSelector}`);
    }
  }

class ElementObserverMessages extends ElementObserver {
    constructor(page, callbackName) {
        super(page, SnapSelectors.CHATBOX, callbackName, [SnapSelectors.MESSAGES, SnapSelectors.CHATBOX]);
    }
}

class ElementObserverSent extends ElementObserver {
    constructor(page, callbackName) {
        super(page, SnapSelectors.CHATBOX, callbackName, [SnapSelectors.DELIVERED_MESSAGE]);
    }
}

module.exports = {
    ElementObserverMessages,
    ElementObserverSent
};
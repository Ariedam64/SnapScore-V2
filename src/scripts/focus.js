
const focusScript = {
    name: 'Focus',
    description: 'Unbreak Snapchat web. Disable focus tracking and screenshot prevention',
    script: `
        // ==UserScript==
        // @name         Unbreak Snapchat web. Disable focus tracking and screenshot prevention
        // @namespace    http://tampermonkey.net/
        // @version      0.1.2
        // @description  Improve the Snapchat web experience by disabling screenshot prevention features which don't prevent screenshots but do actively harm the usability.
        // @match        https://web.snapchat.com/*
        // @icon         http://snapchat.com/favicon.ico
        // @license      MIT
        // ==/UserScript==
    
        (function() {
            'use strict';

            function __unblockControlKeyEvents() {
                const events = ["keydown", "keyup", "keypress"];
                const modifyKeys = ["Control", "Meta", "Alt", "Shift"];
                for (var i = 0; i < events.length; i++) {
                    var event_type = events[i];
                    document.addEventListener(
                        event_type,
                        function (e) {
                            if (modifyKeys.includes(e.key)) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.stopImmediatePropagation();
                            }
                        },
                        true
                    );
                }
            }

            function __unblockEvent() {
                for (var i = 0; i < arguments.length; i++) {
                    var event_type = arguments[i];
                    document.addEventListener(
                        arguments[i],
                        function (e) {
                            e.stopPropagation();
                        },
                        true
                    );
                }
            }

            function __fixConsole() {
                const iframe = document.createElement("iframe");
                iframe.style.display = "none";
                document.body.appendChild(iframe);
                const nativeConsole = iframe.contentWindow.console;
                window.console = nativeConsole;
            }

            function __setupUnblocker() {
                __fixConsole();
                __unblockControlKeyEvents();
                __unblockEvent("contextmenu");
            }

            __setupUnblocker();
            setTimeout(__setupUnblocker, 1000);
            setTimeout(__setupUnblocker, 5000);
            setTimeout(__setupUnblocker, 10000);

            document.hasFocus = function() { return true; }
        })();
    `
};

module.exports = {
    focusScript
};
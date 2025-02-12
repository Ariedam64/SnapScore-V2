async function injectScript(page, script){
    await page.evaluate(script.script);
    console.log("Injected script: " + script.name);
}

module.exports = {
    injectScript
}
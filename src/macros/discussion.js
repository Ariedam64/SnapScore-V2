const { SnapSelectors } = require('../DOM/selectors');

async function findFriendDiscussion(page, discussionName) {
    const result = await page.evaluate((discussionName, allDiscussionSelector, nameSelector) => {
        const allDiscussions = document.querySelectorAll(allDiscussionSelector);
        for (let discussion of allDiscussions) {
            const nameElement = discussion.querySelector(nameSelector);
            if (nameElement) {
                const discussionText = nameElement.textContent.trim().toLowerCase();
                if (discussionText.includes(discussionName)) {
                    discussion.click();
                    return discussionName;
                }
            }
        }
        return false;
    }, discussionName.toLowerCase(), SnapSelectors.DISCUSSIONS_ALL, SnapSelectors.DISCUSSION_NAME);

    if (result){
        await page.waitForSelector(SnapSelectors.CHATBOX);
    }
    console.log(result ? '✅ Discussion found' : '❌ No discussion found');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return result;
}

async function findGroupDiscussion(page, discussionName) {
    const groupElementClass = SnapSelectors.DISCUSSIONS_ALL
    const result = await page.evaluate((groupName, groupElementClass, selector) => {
        const items = document.querySelectorAll(selector);
        for (let span of items) {
            if (span.textContent.toLowerCase().includes(groupName.toLowerCase())) {
                span.closest(groupElementClass).click();
                return groupName;
            }
        }
        return false;
    }, discussionName, groupElementClass, SnapSelectors.DISCUSSIONS_GROUP_ONLY);

    if (result){
        await page.waitForSelector(SnapSelectors.CHATBOX)
    }
    console.log(result ? '✅ Group found' : '❌ No group found');
    await new Promise(resolve => setTimeout(resolve, 1000));
    return result;
}

module.exports = {
    findFriendDiscussion,
    findGroupDiscussion
}
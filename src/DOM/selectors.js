const SnapSelectors = {
    // Discussion selectors
    DISCUSSIONS_ALL: '.O4POs', // All discussions
    DISCUSSIONS_GROUP_ONLY: '.O4POs span.FiLwP[dir="auto"]', // Group discussions only
    DISCUSSION_NAME: '.FiLwP .nonIntl', // Discussion name

    // Chatbox selectors
    CHATBOX: '.MibAa', // Chatbox container
    DELIVERED_MESSAGE: '.KB4Aq.SOEIP.IPEgq', // Delivered message
    UNOPENED_MESSAGE: '.OXbMa', // Unread message
    OPENED_MESSAGE: '.ZSE8T', // Opened message
    WAITING_MESSAGE: '.SO_ne', // Waiting message
    MESSAGES: '.ujRzj', // New message

    // Camera selectors
    CAMERA_BUTTON: '.cDumY', // Camera button
    CAMERA_LOADED: '#cameraKitContainer', // Camera loaded container
    BACK_CAMERA_BUTTON: '.STlkX', // Back camera button
    TAKE_PICTURE_BUTTON: '.gK0xL', // Take picture button
    SEND_TO_BUTTON: '.fGS78', // Send to button
    SEND_PICTURE_BUTTON: '.TYX6O', // Send picture button
};

module.exports = { SnapSelectors };
const { default: Bot } = require("el-bot");

/**
 * 机器人被邀请
 * @param {Bot} ctx 
 */
module.exports = (ctx) => {
    const {mirai, user} = ctx;
    mirai.on('BotInvitedJoinGroupRequestEvent', (event) => {
        if (user.isAllowed(event.fromId)) {
            mirai.api.responseBotInvitedJoinGroupRequest(event, 'allow', '同意');
        } else {
            mirai.api.responseBotInvitedJoinGroupRequest(event, 'deny', '不加新群');
        }
    });
};
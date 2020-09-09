const { default: Bot } = require("el-bot");

/**
 * 机器人被邀请
 * @param {Bot} ctx 
 */
module.exports = (ctx) => {
    const {mirai, user} = ctx;
    mirai.on('BotInvitedJoinGroupRequestEvent', (event) => {
        if (user.isAllowed(event.fromId)) {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 'allow', '同意');
        } else {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 'deny', '不加新群');
        }
    });
};
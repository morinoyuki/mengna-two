const { default: Bot } = require("el-bot");
// const { Message } = require('mirai-ts');
const { coolDown } = require("../../utils");
const { QuitGroup } = require('./schema')

/**
 * 机器人被邀请
 * @param {Bot} ctx 
 */
module.exports = async (ctx) => {
    const { mirai } = ctx;

    const cool = coolDown()
    const fCool = coolDown()

    const getReply = (qq, group) => {
        return async message => {
            if (group) return await mirai.api.sendTempMessage(message, qq, group)
            return null
        }
    }

    mirai.on('BotInvitedJoinGroupRequestEvent', async event => {
        if (await QuitGroup.findOne({ group: event.groupId })) {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加')
            mirai.api.sendFriendMessage('已被列为黑名单', event.fromId)
        } else {
            await mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意')
            await mirai.api.sendGroupMessage('发送“帮助”即可获取功能列表', event.groupId)
            // cool.setCoolDown(event.fromId, 24 * 60 * 60)
        }
        // } else {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加')
        // }
        // if (user.isAllowed(event.fromId)) {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意');
        // } else {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加新群');
        // }
    })
    mirai.on('NewFriendRequestEvent', event => {
        if (fCool.checkCoolDown(event.fromId, getReply(event.fromId, event.groupId))) {
            mirai.api.resp.newFriendRequest(event, 0, '同意')
            fCool.setCoolDown(event.fromId, 2 * 60 * 60)
        }
    })
    mirai.on('BotMuteEvent', async event => { // 被禁言时退出并列为黑名单
        mirai.api.quit(event.operator.group.id)
        const doc = await QuitGroup.findOne({ group: event.operator.group.id })
        if (!doc) {
            const quitGroup = new QuitGroup({ group: event.operator.group.id })
            quitGroup.save()
        }
    })
};
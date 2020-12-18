const { default: Bot } = require("el-bot");
const { Message } = require('mirai-ts');
const { coolDown } = require("../../utils");

/**
 * 机器人被邀请
 * @param {Bot} ctx 
 */
module.exports = async (ctx) => {
    const { mirai, db } = ctx;
    const collection = db.collection('quitGroup')
    const cool = coolDown()
    const fCool = coolDown()
    if (await collection.find().count() === 0) {
        collection.createIndex(
            {
                group: 1
            },
            {
                unique: true
            }
        )
    }
    mirai.on('BotInvitedJoinGroupRequestEvent', async event => {
        if (await collection.findOne({ group: event.groupId })) {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加')
            mirai.api.sendFriendMessage([Message.Plain('已被列为黑名单')])
        }

        // } else if (cool.checkCoolDown(event.fromId, event.reply)) {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意')
        //     cool.setCoolDown(event.fromId, 24 * 60 * 60)
        // } else {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加')
        // }
        if (user.isAllowed(event.fromId)) {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意');
        } else {
            mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加新群');
        }
    })
    // mirai.on('NewFriendRequestEvent', event => {
    // if (fCool.checkCoolDown(event.fromId, event.reply)) {
    //     mirai.api.resp.newFriendRequest(event, 0, '同意')
    //     fCool.setCoolDown(event.fromId, 2 * 60 * 60)
    // }
    // })
    mirai.on('BotMuteEvent', async event => { // 被禁言时退出并列为黑名单
        mirai.api.quit(event.operator.group.id)
        const doc = await collection.findOne({ group: event.operator.group.id })
        if (!doc) {
            collection.insertOne({ group: event.operator.group.id })
        }
    })
};
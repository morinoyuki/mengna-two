const { default: Bot } = require("el-bot");

/**
 * 机器人被邀请
 * @param {Bot} ctx 
 */
module.exports = async (ctx) => {
    const { mirai, db } = ctx;
    const collection = db.collection('quitGroup')
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
            event.reply('以被列为黑名单')
            return
        }
        mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意')
        // if (user.isAllowed(event.fromId)) {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 0, '同意');
        // } else {
        //     mirai.api.resp.botInvitedJoinGroupRequest(event, 1, '不加新群');
        // }
    })
    mirai.on('NewFriendRequestEvent', event => {
        mirai.api.resp.newFriendRequest(event, 0, '同意')
    })
    mirai.on('BotMuteEvent', async event => {
        mirai.api.quit(event.operator.group.id)
        const doc = await collection.findOne({ group: event.operator.group.id })
        if (!doc) {
            collection.insertOne({ group: event.operator.group.id })
        }
    })
};
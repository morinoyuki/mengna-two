const { default: Bot, utils } = require("el-bot");
const Manager = require('./manager');
let groupManagerOptions = {
    listen: {
        group: [
            828090839,
        ]
    },
    ocr: {
        enable: false
    },
    muteTime: 30 * 60
};


/**
 * 简易群管系统
 * @param {Bot} ctx 
 * @param {Object} options 
 */
module.exports = async (ctx, options) => {
    const { mirai, user, status: { isListening } } = ctx;
    utils.config.merge(groupManagerOptions, options);
    const manager = new Manager(ctx, groupManagerOptions)
    mirai.on('GroupMessage', async msg => {
        // 非监控群
        if (!isListening(msg.sender, groupManagerOptions.listen)) return;
        const cmdKeyword = msg.plain.split(' ')[0].toLowerCase().trim();
        switch (cmdKeyword) {
            case 'addkey':
                if (!user.isAllowed(msg.sender.id)) {
                    msg.reply('无权操作');
                    return;
                }
                const _temp = msg.plain.slice(cmdKeyword.length).trim();
                const [type, keyword] = _temp.split(' ').map(v => {
                    return v.trim();
                });
                try {
                    const r = await manager.addKeyword(keyword, type);
                    msg.reply(`Done ObjectID: ${r.insertedId}`);
                } catch (e) {
                    msg.reply(e.message);
                }
                break;
            case 'setmeta':
                if (!user.isAllowed(msg.sender.id)) {
                    msg.reply('无权操作');
                    return;
                }
                const _t = msg.plain.slice(cmdKeyword.length).trim();
                const id = _t.split(' ')[0];
                const meta = JSON.parse(_t.slice(id.length).trim());
                try {
                    const r = await manager.setKeywordMeta(id, meta);
                    msg.reply(`Done res: ${JSON.stringify(r.result)}`);
                } catch (e) {
                    msg.reply(e.message);
                }
                break;
            default:
                if (msg.sender.permission != 'MEMBER') return;
                manager.check(msg);
                break;
        }
    });
};
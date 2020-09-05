const { utils, default: Bot } = require('el-bot');
const { check } = require('mirai-ts');
let helpOptions = {
    match: [
        {
            is: '帮助'
        }
    ]
}

/**
 * 帮助信息
 * @param {Bot} ctx 
 * @param {helpOptions} options 
 */
module.exports = (ctx, options) => {
    const mirai = ctx.mirai
    utils.config.merge(helpOptions, options)
    mirai.on('message', (msg) => {
        helpOptions.match.forEach((obj) => {
            if (check.match(msg.plain, obj)) {
                const text = `可用指令：
    搜图 [...image]
    搜番 [...image]
    点歌/网易点歌 <keyword>
    QQ点歌 <keyword>
    舔狗日记
    涩图/色图
    彩虹屁
    一言
    sleep`
                msg.reply(text)
            }
        })
    })
}
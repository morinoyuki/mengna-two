const { utils, default: Bot } = require('el-bot');
const { check, Message } = require('mirai-ts');
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
    舔狗日记/旧舔狗日记
    涩图/色图
    彩虹屁
    神回复
    骂我 (暂停)
    一言
    投食
    sleep`
                msg.reply(text).then(r => console.log(r))
            }
        })
        if (msg.plain === '投食') {
            msg.reply(
                [
                    Message.Image(null, null, 'toushi/wx.jpg'),
                    Message.Image(null, null, 'toushi/zfb.jpg'),
                    Message.Plain('\n如果喜欢我，欢迎投食')
                ]
            )
        }
    })
}
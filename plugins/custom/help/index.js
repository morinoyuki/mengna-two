module.exports = (ctx) => {
    const mirai = ctx.mirai
    mirai.on('message', (msg) => {
        if (msg.plain === '帮助') {
            const text = `可用指令：
    搜图 [...image]
    搜番 [...image]
    点歌/网易点歌 <keyword>
    QQ点歌 <keyword>
    舔狗日记
    涩图/色图
    骚话
    sleep`
            msg.reply(text)
        }
    })
}
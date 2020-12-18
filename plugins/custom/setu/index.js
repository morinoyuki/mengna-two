const axios = require("axios").default;
const schedule = require('node-schedule');
const { default: Bot, utils: { config } } = require("el-bot");
const { Message, check } = require('mirai-ts');

let setuOpt = {
    apiKey: '',
    proxy: "https://images.weserv.nl/?url=",
    loliconApiGroup: [],
    limit: 5,
    cron: '0 0 2 * * *',
    match: [
        {
            is: '色图'
        }
    ]
}

let limitData = {}

/**
 * 格式化结果
 * @param {Object} data 
 */
function formatResult(data) {
    if (setuOpt.proxy) data.url = setuOpt.proxy + data.url
    const r = [
        Message.Image(null, data.url),
        Message.Plain(
            `\n标题: ${data.title}` +
            `\nP站ID: ${data.pid}` +
            `\nTAG: ${data.tags.join()}`
        )
    ]
    return r
}
async function getLoliconSetu(r18 = false, keyword) {
    const { data } = await axios.get(`https://api.lolicon.app/setu/?apikey=${setuOpt.apiKey}&r18=${Number(r18)}&size1200=true` +
        (keyword ? '&keyword=' + keyword : ''))
    if (data.code === 0) {
        return formatResult(data.data[0])
    } else if (data.code === 429) {
        return '总额度已达到上限'
    } else {
        return '未知错误 code: ' + data.code
    }
}
async function getSetu() {
    const { data } = await axios.get('https://el-bot-api.vercel.app/api/setu')
    return formatResult(data)

}
function checkLimit(sender) {
    return limitData[sender.id.toString()] === undefined ||
        limitData[sender.id.toString()] < setuOpt.limit
}

/**
 * 色图
 * @param {Bot} ctx 
 * @param {setuOpt} options 
 */
module.exports = (ctx, options) => {
    const { mirai } = ctx
    config.merge(setuOpt, options)
    schedule.scheduleJob(setuOpt.cron, () => {
        limitData = {}
    })
    let r18 = false
    mirai.on('GroupMessage', async msg => {
        if (msg.plain === '小亚涩图') {
            msg.reply(await getLoliconSetu(false, encodeURI('アスナ')))
        }
    })
    mirai.on('message', msg => {
        if (msg.plain === 'r18开关') {
            if (ctx.user.isMaster(msg.sender.id)) {
                r18 = !r18
                msg.reply(`当前已切换为${r18}`)
            } else {
                msg.reply('无权开启')
            }
        }
        setuOpt.match.forEach(async obj => {
            if (check.match(msg.plain, obj)) {
                if (checkLimit(msg.sender)) {
                    if (msg.type === 'GroupMessage' && setuOpt.loliconApiGroup.includes(msg.sender.group.id)) {
                        msg.reply(await getLoliconSetu(r18))
                    } else {
                        msg.reply(await getSetu())
                    }
                    limitData[msg.sender.id.toString()] = (limitData[msg.sender.id.toString()] || 0) + 1
                } else {
                    msg.reply('你已冲死将在晚上2点复活\n但欢迎来【喵萌次元】(www.miomoe.com)下载和分享资源')
                }
            }
        })
    })
}
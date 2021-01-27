const axios = require("axios").default;
const schedule = require('node-schedule');
const stringRandom = require('string-random');
const { getAdLink } = require('../../utils');
const { default: Bot, utils: { config } } = require("el-bot");
const { Message, check } = require('mirai-ts');

let setuOpt = {
    apiKey: '',
    // proxy: "https://images.weserv.nl/?url=",
    loliconApiGroup: [],
    limit: 3,
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
async function formatResult(data) {
    if (setuOpt.proxy) data.url = setuOpt.proxy + data.url
    const r = [
        [
            Message.FlashImage(null, data.url)
        ],
        [
            Message.Plain(
                `标题: ${data.title}` +
                `\nP站: ${await getAdLink('https://www.pixiv.net/artworks/' + data.pid)}`
                // `\nTAG: ${data.tags.join()}`
            )
        ]
    ]
    return r
}
async function getLoliconSetu(r18 = false, keyword) {
    const { data } = await axios.get(`https://api.lolicon.app/setu/?apikey=${setuOpt.apiKey}&r18=${Number(r18)}&size1200=true` +
        (keyword ? '&keyword=' + keyword : ''))
    if (data.code === 0) {
        return await formatResult(data.data[0])
    } else if (data.code === 429) {
        return '总额度已达到上限'
    } else {
        return '未知错误 code: ' + data.code
    }
}
async function getSetu() {
    const { data } = await axios.get('https://el-bot-api.vercel.app/api/setu')
    return await formatResult(data)

}
function checkLimit(sender) {
    return limitData[sender.id.toString()] === undefined ||
        limitData[sender.id.toString()].num < setuOpt.limit
}

/**
 * 色图
 * @param {Bot} ctx 
 * @param {setuOpt} options 
 */
module.exports = (ctx, options) => {
    const { mirai, webhook } = ctx
    config.merge(setuOpt, options)

    schedule.scheduleJob(setuOpt.cron, () => {
        limitData = {}
    })


    webhook.on('setu',
        /**
         * 清零
         * @param {*} data 
         * @param {ServerResponse} res 
         */
        (data, res) => {
            const { qq, code } = data
            if (limitData[qq] && limitData[qq].code === code && !limitData[qq].reset) {
                limitData[qq].num = 0
                limitData[qq].reset = true
                res.end('已成功清零复活')
            } else {
                res.end('错误')
            }

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
                    if (!limitData[msg.sender.id.toString()])
                        limitData[msg.sender.id.toString()] = { num: 1, reset: false, code: stringRandom(16) }
                    else
                        limitData[msg.sender.id.toString()].num++

                    if (msg.type === 'GroupMessage' && setuOpt.loliconApiGroup.includes(msg.sender.group.id)) {
                        const result = await getLoliconSetu(r18)
                        await msg.reply(result[0])
                        msg.reply(result[1])
                    } else {
                        const result = await getSetu(r18)
                        await msg.reply(result[0])
                        msg.reply(result[1])
                    }
                } else if (!limitData[msg.sender.id.toString()].reset) {
                    msg.reply(`你已冲死将在晚上2点复活 或是访问：${await getAdLink(`http://39.98.148.66:7777/?type=setu&qq=${msg.sender.id}&code=${limitData[msg.sender.id.toString()].code}`)} 清零`)
                } else {
                    msg.reply('你已再起不能将在晚上2点复活')
                }
            }
        })
    })
}
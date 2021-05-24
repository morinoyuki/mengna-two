const axios = require("axios").default;
const schedule = require('node-schedule');
const stringRandom = require('string-random');
const { getAdLink } = require('../../utils');
const { default: Bot, utils: { config } } = require("el-bot");
const { Message, check } = require('mirai-ts');

let setuOpt = {
    apiKey: '',
    resetDomain: '',
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
            Message.Image(null, data.url)
        ],
        [
            Message.Plain(
                `标题: ${data.title}` +
                `\nP站: ${await getAdLink('https://www.pixiv.net/artworks/' + data.pid)}` +
                // `\nP站: https://www.pixiv.net/artworks/${data.pid}` +
                `\nTAG: ${data.tags.join()}`
                // '\n提示：如要原图请到上方地址获取'
            )
        ]
    ]
    return r
}
async function getSetu() {
    const { data } = await axios.get('https://el-bot-api.vercel.app/api/setu')
    return await formatResult(data)
}

async function getLoliconSetu(r18 = false, keyword) {
    const { data } = await axios.get(`https://api.lolicon.app/setu/?apikey=${setuOpt.apiKey}&r18=${Number(r18)}&size1200=true` +
        (keyword ? '&keyword=' + keyword : ''))
    if (data.code === 0) {
        return await formatResult(data.data[0])
    } else if (data.code === 429) {
        return await getSetu()
    } else {
        return '未知错误 code: ' + data.code
    }
}

function checkLimit(sender) {
    return limitData[sender.id.toString()] === undefined ||
        limitData[sender.id.toString()].num < setuOpt.limit
}
/**
 * 
 * @param {*} msg 
 * @param {Boolean} lolicon 
 * @param {Boolean} r18 
 */
async function sendSetu(msg, lolicon, r18) {
    const result = await (lolicon ? getLoliconSetu(r18) : getSetu())
    const r = await msg.reply(result[0])
    msg.reply(result[1])
    return r
    // msg.reply([Message.Quote(r.messageId), ...result[1]])
}

/**
 * 色图
 * @param {Bot} ctx 
 * @param {setuOpt} options 
 */
module.exports = (ctx, options) => {
    const { mirai, logger, webhook } = ctx
    config.merge(setuOpt, options)

    schedule.scheduleJob(setuOpt.cron, () => {
        limitData = {}
    })

    const autoRemove = result => {
        if (result.code === 0) setTimeout(() => {
            mirai.api.recall(result.messageId).then(r => {
                if (r.code === 0) logger.success('[setu] 成功撤回: ' + result.messageId)
            })
        }, (2 * 60 * 1000) - 5000)
    }

    if (webhook.config.enable) webhook.on('setu',
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
        }
    )

    let r18 = false

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

                    if (ctx.el.qq === 1005432229) {
                        if (msg.type === 'GroupMessage' && setuOpt.loliconApiGroup.includes(msg.sender.group.id)) {
                            sendSetu(msg, true, r18).then(autoRemove)
                        } else {
                            sendSetu(msg, false, false).then(autoRemove)
                        }
                    } else {
                        sendSetu(msg, true, false).then(autoRemove)

                    }
                } else if (!limitData[msg.sender.id.toString()].reset && webhook.config.enable) {
                    msg.reply(`你已冲死将在晚上2点复活 或是访问：${await getAdLink(`http://${setuOpt.resetDomain}:${webhook.config.port}/?type=setu&qq=${msg.sender.id}&code=${limitData[msg.sender.id.toString()].code}`)} 复活`)
                } else {
                    msg.reply('你已再起不能将在晚上2点复活')
                }
            }
        })
    })
}
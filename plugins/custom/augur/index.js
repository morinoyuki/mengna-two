const { default: Axios } = require("axios")
const { default: Bot } = require("el-bot")
const FromData = require('form-data')
const { JSDOM } = require('jsdom')

const list = {
    '二次元人设': 683217,
    '变态程度': 1032909,
    '你是什么做的': 761425,
    '淫欲地下城': 1043561,
    '小JJ长度': 16051,
    '呼神护卫': 1032334,
    '正确饲养你的方法': 556031,
    '神明创造你的十日': 829014,
    '中二称号': 790697,
    '精神病院': 403243,
    '梦病塔': 759939,
    '角之旅': 940214,
    '看了群主女装': 476023,
    '地牢探险': 905828
}
async function getAugur(id, name) {
    try {
        const formData = new FromData()
        formData.append('u', name)
        const { data } = await Axios.post('https://cn.shindanmaker.com/' + id, formData, { headers: formData.getHeaders() })

        const { window: { document } } = new JSDOM(data)
        const result = document.querySelector('.result2').textContent
        const content = result.replace('<br>', '\n').replace(/<.+>/ig, '').trim()
        return content
    } catch {
        return '占卜数据读取失败'
    }

}

/**
 * 占卜
 * @param {Bot} ctx 
 */
module.exports = ctx => {
    const { mirai } = ctx
    mirai.on('message', async msg => {
        const keyword = msg.plain.split(' ')[0].toLowerCase()
        if (msg.plain === '占卜') {
            const content = '可用项目有：\n' +
                Object.keys(list).join('\n')
            msg.reply(content)
        }
        if (keyword === '占卜') {
            const augurName = msg.plain.slice(keyword.length).trim()
            const augurId = list[augurName.toUpperCase()]
            if (augurId)
                msg.reply(await getAugur(augurId, msg.sender.memberName || msg.sender.nickname))
        }
    })
}


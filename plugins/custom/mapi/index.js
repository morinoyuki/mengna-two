const { default: Bot } = require('el-bot');
const { log } = require('mirai-ts');
const axios = require('axios').default;

/**
 * 彩虹屁
 * @param {Bot} ctx 
 */
module.exports = async (ctx) => {
    const { mirai } = ctx
    mirai.on('message', async (msg) => {
        if (msg.plain === '彩虹屁') {
            try {
                const { data } = await axios.get('https://chp.shadiao.app/api.php')
                msg.reply(data)
            } catch (e) {
                log.warning(e)
                msg.reply('失败')
            }
        }
    })
};
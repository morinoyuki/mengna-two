const { log } = require('mirai-ts');
const axios = require('axios').default;

module.exports = async (ctx) => {
    const {mirai} = ctx
    mirai.on('message', async (msg) => {
        if (msg.plain === '骚话') {
            try {
                const {data} = await axios.get('https://chp.shadiao.app/api.php')
                msg.reply(data)
            } catch (e) {
                log.warning(e)
                msg.reply('失败')
            }
        }
    })
};
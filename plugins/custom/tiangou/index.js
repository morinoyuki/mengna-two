const { utils } = require('el-bot');
// const util = require('util'); 
const { Message, check, log } = require('mirai-ts');
const axios = require('axios').default;

const apiUrl = 'https://www.somekey.cn/tiangou/random.php';
let tiangouOptions = {
    match: [
        {
            is: '舔狗日记'
        }
    ]
};

async function getDog() {
    try {
        const response = await axios.get(apiUrl);
        const data = response.data;
        if (data.code != 1) {
            return '查询失败';
        }
        return `${data.data.date} ${data.data.weather}\n${data.data.content}`;
    } catch (e) {
        log.warning(e);
        return '查询失败';
    }

}
module.exports = async (ctx, options) => {
    const mirai = ctx.mirai;
    utils.config.merge(tiangouOptions, options);
    mirai.on('message', async (msg) => {
        tiangouOptions.match.forEach(async (obj) => {
            if (check.match(msg.plain, obj)) {
                msg.reply(await getDog());
            }
        });
    });
}
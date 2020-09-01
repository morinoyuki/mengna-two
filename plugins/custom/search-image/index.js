const { utils } = require('el-bot');
// const util = require('util'); 
const { log, check } = require('mirai-ts');
const saucenao = require('./saucenao');
const ascii2d = require('./ascii2d');

// 配置项
let searchImage = {
    token: '',
    options: {
        results: 2
    },
    ready: '请发送要搜索的图片',
    searching: '少女祈祷中..'
};

module.exports = async (ctx, options) => {
    // const config = ctx.el.config;
    const mirai = ctx.mirai;
    utils.config.merge(searchImage, options);
    let searchImageFlag = {};
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜图') {
            searchImageFlag[`${msg.sender.id}`] = true;
            if (msg.messageChain.length == 2) msg.reply(searchImage.ready);
        }
        if (searchImageFlag[`${msg.sender.id}`]) {
            let searchReply = false;
            msg.messageChain.forEach(async (message) => {
                if (message.type === 'Image') {
                    if (!searchReply) {
                        msg.reply(searchImage.searching);
                        searchReply = true;
                    }
                    let saContent;
                    let similarity;
                    try {
                        const saData = await saucenao(message.url, searchImage.options.results, searchImage.token, searchImage.options);
                        saContent = saData.content
                        similarity = saData.similarity;
                    } catch (e) {
                        log.warning(e);
                        similarity = 0;
                    }
                    if (similarity > 40) {
                        msg.reply(saContent);
                        if (similarity < 60) msg.reply('相似度过低 自动尝试ascii2d查询');
                    } else {
                        msg.reply('SauceNAO查询失败 自动尝试ascii2d查询');
                    }
                    if (similarity < 60) {
                        const a2dContent = await ascii2d(message.url);
                        msg.reply(a2dContent);
                    }
                    // searchImageFlag[`${msg.sender.id}`] = false;
                    delete searchImageFlag[`${msg.sender.id}`];
                }
            })
        }
    });
}
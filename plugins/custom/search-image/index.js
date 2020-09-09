const { utils, default: Bot } = require('el-bot');
// const util = require('util'); 
const { log, Message } = require('mirai-ts');
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

/**
 * 
 * @param {Bot} ctx 
 * @param {searchImage} options 
 */
module.exports = async (ctx, options) => {
    // const config = ctx.el.config;
    const mirai = ctx.mirai;
    utils.config.merge(searchImage, options);
    const client =  saucenao(searchImage.options.results, searchImage.token, searchImage.options);
    let searchImageFlag = {};
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜图') {
            searchImageFlag[msg.sender.id.toString()] = true;
            if (msg.messageChain.length == 2) msg.reply(searchImage.ready);
        }
        if (searchImageFlag[msg.sender.id.toString()]) {
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
                        const saData = await client(message.url);
                        saContent = saData.content;
                        similarity = saData.similarity;
                    } catch (e) {
                        logger.error(`[search-image] ${e.message}`);
                        similarity = 0; 
                    }
                    if (similarity > 40) {
                        if (similarity < 60) saContent.push(Message.Plain('\n相似度过低 自动尝试ascii2d查询'));
                        msg.reply(saContent);
                    } else {
                        msg.reply('SauceNAO查询失败 自动尝试ascii2d查询');
                    }
                    if (similarity < 60) {
                        const a2dContent = await ascii2d(message.url);
                        msg.reply(a2dContent);
                    }
                    // searchImageFlag[`${msg.sender.id}`] = false;
                    delete searchImageFlag[msg.sender.id.toString()];
                }
            })
        }
    });
}
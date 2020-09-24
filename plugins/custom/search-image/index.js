const { utils, default: Bot } = require('el-bot');
const { Message } = require('mirai-ts');
const { getCacheManager } = require('../../utils');
const saucenao = require('./saucenao');
const ascii2d = require('./ascii2d');

// 配置项
let searchImage = {
    token: '',
    options: {
        results: 2
    }
};

/**
 * 
 * @param {Bot} ctx 
 * @param {searchImage} options 
 */
module.exports = async (ctx, options) => {
    // const config = ctx.el.config;
    const { mirai, logger } = ctx;
    utils.config.merge(searchImage, options);
    const client = saucenao(searchImage.options.results, searchImage.token, searchImage.options);
    const cache = getCacheManager(ctx);
    let searchImageFlag = {};
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜图') {
            searchImageFlag[msg.sender.id.toString()] = true;
            if (msg.messageChain.length == 2) msg.reply('请发送要搜索的图片');
        }
        if (searchImageFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async (message) => {
                if (message.type === 'Image') {
                    const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1];
                    const saucenaoCache = await cache.getCache(imageMd5, 'saucenao');
                    let saContent = [];
                    let similarity = 0;
                    if (saucenaoCache) {
                        logger.success('[search-image] 使用缓存数据');
                        msg.reply(saucenaoCache.msg);
                        similarity = saucenaoCache.similarity;
                    } else {
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
                            cache.setCache(imageMd5, 'saucenao', saContent, similarity);
                        } else {
                            msg.reply('SauceNAO查询失败 自动尝试ascii2d查询');
                        }
                    }
                    if (similarity < 60) {
                        const ascii2dCache = await cache.getCache(imageMd5, 'ascii2d');
                        if (ascii2dCache) {
                            logger.success('[search-image] [ascii2d] 使用缓存数据');
                            msg.reply(ascii2dCache.msg);
                        } else {
                            const a2dContent = await ascii2d(message.url, logger);
                            msg.reply(a2dContent);
                            cache.setCache(imageMd5, 'ascii2d', a2dContent, 0);
                        }
                    }
                    // searchImageFlag[`${msg.sender.id}`] = false;
                    if (searchImageFlag[msg.sender.id.toString()]) delete searchImageFlag[msg.sender.id.toString()];
                }
            })
        }
    });
}
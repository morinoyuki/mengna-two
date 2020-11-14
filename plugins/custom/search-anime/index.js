const { default: Bot } = require('el-bot');
const { Message } = require('mirai-ts');
const fetch = require('node-fetch').default;
const TraceMoe = require('tracemoe-helper');
const { getImage, getCacheManager, coolDown } = require('../../utils');

let api;
let logger;
/**
 * 
 * @param {Object} data 
 */
async function formatResult(data) {
    let r = [
        Message.Plain('搜索结果：'),
        Message.Plain(`\n动画名：${data.docs[0].title_native}(${data.docs[0].title_romaji})`),
        Message.Plain(`\n中文名：${data.docs[0].title_chinese || '未知'}`),
        Message.Plain(`\n准确度：${Math.floor(data.docs[0].similarity * 100)}%${data.docs[0].similarity < 0.86 ? '\n（准确度过低，请确保这张图片是完整的、没有裁剪过的动画视频截图）' : ''}`),
        Message.Plain(`\n话数：${data.docs[0].episode || '未知'}`)
    ];
    if (!data.docs[0].is_adult) r = r.concat([Message.Plain('\n'), await getImage(await api.previewImage(data.docs[0].anilist_id, data.docs[0].filename, data.docs[0].at, data.docs[0].tokenthumb))]);
    return r;
}

/**
 * 搜索
 * @param {String} url 
 */
async function traceSearch(url) {
    try {
        const data = await api.search(url);
        if (!data || !data.docs) throw new Error('搜索失败');
        const res = await formatResult(data);
        return res;
    } catch (e) {
        logger.error(`[search-anime] ${e.message}`);
        return '失败';
    }
}
/**
 * 搜番
 * @param {Bot} ctx 
 * @param {Object} options 
 */
module.exports = async (ctx, options) => {
    const mirai = ctx.mirai;
    logger = ctx.logger;
    api = new TraceMoe((options && options.token) || ''); // 实例化
    const cache = getCacheManager(ctx);
    const cool = coolDown();
    let searchFlag = {};
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜番' && cool.checkCoolDown(msg.sender.id, msg.reply)) {
            searchFlag[msg.sender.id.toString()] = true;
            cool.setCoolDown(msg.sender.id, 10 * 60);
            if (msg.messageChain.length == 2) {
                msg.reply('请发送要搜索的截图');
                return
            }
        }
        if (searchFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async (smsg) => {
                if (smsg.type === 'Image') {
                    try {
                        const response = await fetch(smsg.url);
                        const imageType = response.headers.get('Content-Type');
                        if (imageType && imageType === 'image/gif') {
                            msg.reply('GIF不支持');
                            return;
                        }
                        const imageLength = response.headers.get('Content-Length');
                        if (imageLength > 1048576) {
                            msg.reply('大小超过1M');
                            return;
                        }
                        response.clone();
                    } catch (e) {
                        msg.reply('识别图片类型失败');
                        return;
                    }
                    const imageMd5 = smsg.url.match(/\-([^-\/]{32})/)[1];
                    const cacheData = await cache.getCache(imageMd5, 'anime');
                    if (cacheData) {
                        msg.reply(cacheData.msg);
                    } else {
                        const result = await traceSearch(smsg.url);
                        msg.reply(result);
                        if (Array.isArray(result)) cache.setCache(imageMd5, 'anime', result, 0);
                    }
                }
            });
            delete searchFlag[msg.sender.id.toString()];
        }
    });
}
const { searchByUrl } = require('ascii2d');
const { getImage, getAdLink } = require('../../utils');
const { Message } = require('mirai-ts');
const { Logger } = require('el-bot/dist/bot/logger');

/**
 * 格式化结果
 * @param {import('ascii2d').Item} item 
 * @returns {Promise<import('mirai-ts').MessageType.MessageChain>}
 */
async function formatResult(item) {
    let title, type, url;
    if (item.source) {
        title = item.source.title;
        type = item.source.type;
        url = item.source.url;
    } else if (item.externalInfo) {
        title = item.externalInfo.content.title;
        type = item.externalInfo.content.type;
        url = item.externalInfo.content.url;
    }
    const r = [
        await getImage(item.thumbnailUrl),
        Message.Plain(
            `\n标题：${title || '未知'}` +
            `\n站点：${type || '未知'}` +
            `\n链接：${url ? await getAdLink(url) : '未知'}` +
            '\n------------\n'
        ),
    ];
    return r;
}

/**
 * 
 * @param {String} url 
 * @param {Logger} logger 
 */
module.exports = async (url, logger) => {
    let content = [];
    content = content.concat(Message.Plain('特徴検索\n'));
    try {
        const result = await searchByUrl(url, 'bovw');
        for (let i = 0; i < 2; i++) {
            const item = result.items[i];
            content = content.concat(await formatResult(item));
        }
    } catch (e) {
        logger.warning(e.message);
        content = content.concat(Message.Plain('失败\n'));

    }
    content = content.concat(Message.Plain('色合検索\n'));
    try {
        const result = await searchByUrl(url, 'color');
        for (let i = 0; i < 2; i++) {
            const item = result.items[i];
            content = content.concat(await formatResult(item));
        }
    } catch (e) {
        logger.warning(e.message);
        content = content.concat(Message.Plain('失败\n'));
    }
    content = content.concat(Message.Plain('Script by：老森'));
    return content;
}


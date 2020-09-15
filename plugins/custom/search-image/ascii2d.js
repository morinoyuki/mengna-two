const { searchByUrl } = require('ascii2d');
const { getImage } = require('../../utils');
const { Message } = require('mirai-ts');
const { Logger } = require('el-bot/dist/bot/logger');

/**
 * 格式化结果
 * @param {import('ascii2d').Item} item 
 * @returns {import('mirai-ts').MessageType.MessageChain}
 */
async function formatResult(item) {
    let title;
    let type;
    let url;
    if (item.source) {
        title = item.source.title;
        type = item.source.type;
        url = item.source.url;
    } else if (item.externalInfo) {
        title = item.externalInfo.content.title;
        type = item.externalInfo.content.type;
        url = item.externalInfo.content.url;
    } else {
        title, type, url = '未知';
    }
    const r = [
        await getImage(item.thumbnailUrl),
        Message.Plain(`\n标题：${title}`),
        Message.Plain(`\n站点：${type}`),
        Message.Plain(`\n链接：${url}`),
        Message.Plain('\n------------\n'),
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
        const resultb = await searchByUrl(url, 'bovw');
        content = content.concat(await formatResult(resultb.items[0]));
    } catch (e) {
        logger.warning(e.message);
        content = content.concat(Message.Plain('失败\n'));

    }
    content = content.concat(Message.Plain('色合検索\n'));
    try {
        const resultc = await searchByUrl(url, 'color');
        content = content.concat(await formatResult(resultc.items[0]));
    } catch {
        logger.warning(e.message);
        content = content.concat(Message.Plain('失败\n'));
    }
    content = content.concat(Message.Plain('Script by：老森'));
    return content;
}


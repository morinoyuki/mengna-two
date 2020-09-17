const download = require('download');
const stringRandom = require('string-random');
const { Message } = require('mirai-ts');
const CacheManager = require('./CacheManager');
/**
 * 安全的获取图片
 * @param {String} url 
 */
async function getImage(url) {
    let image;
    try {
        const fileName = `${stringRandom(32)}.temp`;
        await download(url, './mirai/data/MiraiAPIHTTP/images', { filename: fileName });
        image = Message.Image(null, null, fileName);
    } catch (e) {
        image = Message.Plain('[error]');
    }
    return image;
}

exports.getImage = getImage;
exports.getCacheManager = CacheManager.getInstance;
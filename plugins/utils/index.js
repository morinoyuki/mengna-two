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
        // await download(url, './mirai/plugins/MiraiAPIHTTP/images', { filename: fileName });
        image = Message.Image(null, null, fileName);
    } catch (e) {
        image = Message.Plain('[error]');
    }
    return image;
}
/**
 * 格式化秒数
 * @param {Number} sec 
 */
function secFormat(sec) {
    const date = {
        d: Math.floor(sec / 60 / 60 / 24),
        h: Math.floor(sec / 60 / 60 % 24),
        m: Math.floor(sec / 60 % 60),
        s: Math.floor(sec % 60)
    };
    return (date.d ? `${date.d}天` : '') +
        (date.h ? `${date.h}小时` : '') +
        (date.m ? `${date.m}分钟` : '') +
        (date.s ? `${date.s}秒` : '');
}
exports.secFormat = secFormat;
exports.getImage = getImage;
exports.getCacheManager = CacheManager.getInstance;
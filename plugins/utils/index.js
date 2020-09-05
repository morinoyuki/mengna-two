const download = require('download');
const stringRandom = require('string-random');
const { Message } = require('mirai-ts');
/**
 * 安全的获取图片
 * @param {String} url 
 */
async function getImage(url) {
    let image;
    try {
        const fileName = `${stringRandom(14)}.temp`;
        await download(url, './mirai/plugins/MiraiAPIHTTP/images', {filename: fileName});
        image = Message.Image(null, null, fileName);
        
    } catch {
        image = Message.Plain('[error]');
    }
    return image
}

exports.getImage = getImage;
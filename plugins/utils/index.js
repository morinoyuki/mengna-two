const download = require('download');
const adultCheck = require('./adultCheck');
const stringRandom = require('string-random');
const { Message } = require('mirai-ts');
const CacheManager = require('./CacheManager');
const { default: axios } = require('axios');

/**
 * 获取广告短链接
 * @param {string} url 
 * @returns {Promise<string>}
 */
async function getAdLink(url) {
    try {
        const { data } = await axios.get(`https://adfoc.us/api/?key=23f9550cd4cef20ce3cb580780e74af9&url=${url}`);
        if (data === '0')
            return url;
        return data;
    } catch {
        return url;
    }
}

/**
 * 安全的获取图片
 * @param {String} url 
 */
async function getImage(url) {
    try {
        if (await adultCheck.submitRemoteImage(url)) {
            return Message.Plain('[Adult]');
        }
        const fileName = `${stringRandom(32)}.temp`;
        await download(url, './mcl/data/net.mamoe.mirai-api-http/images', { filename: fileName });
        return Message.Image(null, null, fileName);
    } catch (e) {
        return Message.Plain('[error]');
    }
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

function coolDown() {
    let coolDownData = {}
    /**
     * 设置冷却时间
     * @param {Number} qq 
     * @param {Number} time 
     */
    const setCoolDown = (qq, time) => {
        coolDownData[qq.toString()] = Date.now() + (time * 1000);
    }
    /**
     * 检查冷却
     * @param {Number} qq 
     * @param {Function} reply
     */
    const checkCoolDown = (qq, reply) => {
        const time = coolDownData[qq.toString()] || 0;
        if (time < Date.now()) {
            if (time) delete coolDownData[qq.toString()];
            return true;
        }
        if (typeof reply === 'function') reply(`冷却中 ${secFormat((time - Date.now()) / 1000)}`);
        return false;
    }
    return {
        checkCoolDown,
        setCoolDown
    }

}
exports.getAdLink = getAdLink;
exports.coolDown = coolDown;
exports.secFormat = secFormat;
exports.getImage = getImage;
exports.getCacheManager = CacheManager.getInstance;
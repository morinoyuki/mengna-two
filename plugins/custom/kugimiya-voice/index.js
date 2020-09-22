const fs = require('fs');
const { Message } = require('mirai-ts');
const { default: Bot } = require('el-bot');
const { Logger } = require('el-bot/dist/bot/logger');

let cacheFiles = [];

/**
 * 载入文件列表
 * @param {Logger} logger 
 */
function loadFiles(logger) {
    try {
        cacheFiles = fs.readdirSync('./mirai/data/MiraiAPIHTTP/voices/钉宫');
    } catch (e) {
        logger.error(`[kugimiya-voice] ${e.message}`);
    }
}
/**
 * 发送语音
 * @param {Function} reply 
 */
function sendVoice(reply) {
    const i = Math.floor(Math.random() * cacheFiles.length);
    const voice = cacheFiles[i];
    reply([Message.Voice(null, null, `钉宫/${voice}`)]);
}

/**
 * 钉宫语音
 * @param {Bot} ctx 
 */
module.exports = ctx => {
    const { mirai, logger } = ctx;
    logger.info('[kugimiya-voice] 首次运行正在读取文件列表到缓存');
    loadFiles(logger);
    mirai.on('message', msg => {
        if (msg.plain === '骂我') {
            if (cacheFiles.length) {
                sendVoice(msg.reply);
            } else {
                loadFiles(logger);
                if (cacheFiles.length) sendVoice(msg.reply);
            }
        }
    });
};
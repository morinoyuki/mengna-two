const { utils, default: Bot } = require('el-bot')
const { Message } = require('mirai-ts')
const { getCacheManager, coolDown } = require('../../utils')
const saucenao = require('./saucenao')
const ascii2d = require('./ascii2d')
// const iqdb = require('./iqdb')

let client
let cache

// 配置项
let searchImage = {
    token: [],
    options: {
        results: 2
    }
}

function limitTime(time, fn) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject(new Error('超时'))
        }, time);
        fn().then(resolve).catch(reject)
    })
}

async function saSearch(url, imageMd5, logger) {
    logger.info('[search-image] [saucenao] 检查缓存')
    const saucenaoCache = await cache.getCache(imageMd5, 'saucenao')
    let content = []
    let similarity = 0
    if (saucenaoCache) {
        logger.success('[search-image] [saucenao] 使用缓存数据')
        content = saucenaoCache.msg
        similarity = saucenaoCache.similarity
    } else {
        logger.info('[search-image] [saucenao] 搜索中')
        try {
            const saData = await limitTime(3 * 60 * 1000, async () => await client(url))
            logger.success('[search-image] [saucenao] 搜索结束')
            content = saData.content
            similarity = saData.similarity
            cache.setCache(imageMd5, 'saucenao', content, similarity)
        } catch (e) {
            logger.error(`[search-image] ${e.message}`)
            similarity = 0
        }
    }
    return {
        content,
        similarity
    }
}

async function a2dSearch(url, imageMd5, logger) {
    logger.info('[search-image] [ascii2d] 检查缓存')
    const ascii2dCache = await cache.getCache(imageMd5, 'ascii2d')
    if (ascii2dCache) {
        logger.success('[search-image] [ascii2d] 使用缓存数据')
        return ascii2dCache.msg
    } else {
        logger.info('[search-image] [ascii2d] 搜索中')
        try {
            const a2dContent = await limitTime(3 * 60 * 1000, async () => await ascii2d(url, logger))
            await ascii2d(url, logger)
            logger.success('[search-image] [ascii2d] 搜索结束')
            cache.setCache(imageMd5, 'ascii2d', a2dContent, 0)
            return a2dContent
        } catch (e) {
            logger.error(`[search-image] ${e.message}`)
            return [Message.Plain(e.message)]
        }
    }
}


// async function iqdbSearch(url, imageMd5, logger) {
//     logger.info('[search-image] [iqdb] 检查缓存')
//     const iqdbCache = await cache.getCache(imageMd5, 'iqdb')
//     if (iqdbCache) {
//         logger.success('[search-image] [iqdb] 使用缓存数据')
//         return { content: iqdbCache.msg, similarity: iqdbCache.similarity }
//     } else {
//         logger.info('[search-image] [iqdb] 搜索中')
//         try {
//             const iqData = await limitTime(3 * 60 * 1000, async () => await iqdb(url))
//             logger.success('[search-image] [iqdb] 搜索结束')
//             cache.setCache(imageMd5, 'iqdb', iqData.content, iqData.similarity)
//             return iqData
//         } catch (e) {
//             logger.error(`[search-image] ${e.message}`)
//             return { content: [Message.Plain('error: ' + e.message)], similarity: 0 }
//         }
//     }
// }


/**
 * 搜图
 * @param {Bot} ctx 
 * @param {searchImage} options 
 */
module.exports = async (ctx, options) => {
    if (!ctx.db) return
    const { mirai, logger } = ctx
    utils.config.merge(searchImage, options)
    const cool = coolDown()
    // const iCool = coolDown()
    client = saucenao(searchImage.options.results, searchImage.token, searchImage.options)
    cache = getCacheManager(ctx)
    const autoRemove = result => {
        if (result.code === 0) setTimeout(() => {
            mirai.api.recall(result.messageId).then(r => {
                if (r.code === 0) logger.success('[search-image] 成功撤回: ' + result.messageId)
            })
        }, (2 * 60 * 1000) - 5000)
    }
    let searchImageFlag = {}
    let a2dFlag = {}
    // let iqdbFlag = {}
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜图' && cool.checkCoolDown(msg.sender.id, msg.reply)) {
            searchImageFlag[msg.sender.id.toString()] = true
            cool.setCoolDown(msg.sender.id, 5 * 60)
            if (msg.messageChain.length == 2) {
                msg.reply('请发送要搜索的图片')
                return
            }
        } else if ((msg.plain.trim() === 'a2d' || msg.plain.trim() === 'ascii2d') && cool.checkCoolDown(msg.sender.id, msg.reply)) {
            cool.setCoolDown(msg.sender.id, 5 * 60)
            a2dFlag[msg.sender.id.toString()] = true
            if (msg.messageChain.length == 2) {
                msg.reply('请发送要搜索的图片')
                return
            }
        } //else if ((msg.plain.trim() === 'iqdb' || msg.plain.trim() === 'iq搜图') && iCool.checkCoolDown(msg.sender.id, msg.reply)) {
        //     iCool.setCoolDown(msg.sender.id, 5 * 60)
        //     iqdbFlag[msg.sender.id.toString()] = true
        //     if (msg.messageChain.length == 2) {
        //         msg.reply('请发送要搜索的图片')
        //         return
        //     }
        // }
        if (searchImageFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async (message) => {
                if (message.type === 'Image') {
                    const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1]
                    logger.success('[search-image] 取得图片MD5: ' + imageMd5)
                    let saData = await saSearch(message.url, imageMd5, logger)
                    if (saData.similarity >= 40) {
                        if (saData.similarity < 60) {
                            saData.content = [...saData.content, Message.Plain('\n相似度过低 正在尝试ascii2d查询')]
                        } else if (saData.similarity < 80) {
                            saData.content = [...saData.content, Message.Plain('\n相似度较低 若不对请尝试a2d命令进行搜索')]
                            cool.setCoolDown(msg.sender.id, 0)
                        }
                        msg.reply(saData.content).then(v => autoRemove(v)).catch(v => {
                            msg.reply(`错误:${v.message}`)
                        })
                    } else {
                        msg.reply('SauceNAO查询失败 正在尝试ascii2d查询')
                    }
                    if (saData.similarity <= 60) {
                        // iCool.setCoolDown(msg.sender.id, 10 * 60)
                        // let iqData = await iqdbSearch(message.url, imageMd5, logger)
                        // if (iqData.similarity !== 0) {
                        //     msg.reply(iqData.content).then(v => autoRemove(v)).catch(v => {
                        //         msg.reply(`错误:${v.message}`)
                        //     })
                        // } else {
                        //     msg.reply([...iqData.content, Message.Plain('\n正在尝试ascii2d查询')]).then(v => autoRemove(v)).catch(v => {
                        //         msg.reply(`错误:${v.message}`)
                        //     })
                        // }
                        // if (iqData.similarity < 60) {
                        msg.reply(await a2dSearch(message.url, imageMd5, logger)).then(v => autoRemove(v)).catch(v => {
                            msg.reply(`错误:${v.message}`)
                        })
                        // }
                    }
                }
            })
            if (searchImageFlag[msg.sender.id.toString()]) delete searchImageFlag[msg.sender.id.toString()]
        } else if (a2dFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async message => {
                if (message.type === 'Image') {
                    const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1]
                    logger.success('[search-image] 取得图片MD5: ' + imageMd5)
                    msg.reply(await a2dSearch(message.url, imageMd5, logger)).then(v => autoRemove(v)).catch(v => {
                        msg.reply(`错误:${v.message}`)
                    })
                }
            })
            if (a2dFlag[msg.sender.id.toString()]) delete a2dFlag[msg.sender.id.toString()]
        } //else if (iqdbFlag[msg.sender.id.toString()]) {
        //     msg.messageChain.forEach(async message => {
        //         if (message.type === 'Image') {
        //             const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1]
        //             logger.success('[search-image] 取得图片MD5: ' + imageMd5)
        //             const data = await iqdbSearch(message.url, imageMd5, logger)
        //             msg.reply(data.content).then(v => autoRemove(v)).catch(v => {
        //                 msg.reply(`错误:${v.message}`)
        //             })
        //         }
        //     })
        //     if (iqdbFlag[msg.sender.id.toString()]) delete iqdbFlag[msg.sender.id.toString()]
        // }
    })
}
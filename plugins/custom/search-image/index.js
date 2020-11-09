const { utils, default: Bot } = require('el-bot')
const { Message } = require('mirai-ts')
const { getCacheManager } = require('../../utils')
const saucenao = require('./saucenao')
const ascii2d = require('./ascii2d')

let client
let cache

// 配置项
let searchImage = {
    token: [''],
    options: {
        results: 2
    }
}

async function saSearch(url, imageMd5, logger) {
    const saucenaoCache = await cache.getCache(imageMd5, 'saucenao')
    let saContent = []
    let similarity = 0
    if (saucenaoCache) {
        logger.success('[search-image] 使用缓存数据')
        saContent = saucenaoCache.msg
        similarity = saucenaoCache.similarity
    } else {
        try {
            const saData = await client(url)
            saContent = saData.content
            similarity = saData.similarity
            cache.setCache(imageMd5, 'saucenao', saContent, similarity)
        } catch (e) {
            logger.error(`[search-image] ${e.message}`)
            similarity = 0
        }
    }
    return {
        saContent,
        similarity
    }
}

async function a2dSearch(url, imageMd5, logger) {
    const ascii2dCache = await cache.getCache(imageMd5, 'ascii2d')
    if (ascii2dCache) {
        logger.success('[search-image] [ascii2d] 使用缓存数据')
        return ascii2dCache.msg
    } else {
        const a2dContent = await ascii2d(url, logger)
        cache.setCache(imageMd5, 'ascii2d', a2dContent, 0)
        return a2dContent
    }
}

/**
 * 
 * @param {Bot} ctx 
 * @param {searchImage} options 
 */
module.exports = async (ctx, options) => {
    // const config = ctx.el.config
    const { mirai, logger } = ctx
    utils.config.merge(searchImage, options)
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
    let A2dFlag = {}
    mirai.on('message', async (msg) => {
        if (msg.plain.trim() === '搜图') {
            searchImageFlag[msg.sender.id.toString()] = true
            if (msg.messageChain.length == 2) msg.reply('请发送要搜索的图片')
        } else if (msg.plain.trim() === 'a2d' || msg.plain.trim() === 'ascii2d') {
            A2dFlag[msg.sender.id.toString()] = true
            if (msg.messageChain.length == 2) msg.reply('请发送要搜索的图片')
        }
        if (searchImageFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async (message) => {
                if (message.type === 'Image') {
                    const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1]
                    let { saContent, similarity } = await saSearch(message.url, imageMd5, logger)
                    if (similarity > 40) {
                        if (similarity < 60) {
                            saContent = [...saContent, Message.Plain('\n相似度过低 自动尝试ascii2d查询')]
                        } else if (similarity < 80) {
                            saContent = [...saContent, Message.Plain('\n相似度较低 若不对请尝试ascii2d命令进行搜索')]
                        }
                        msg.reply(saContent).then(v => autoRemove(v))
                    } else {
                        msg.reply('SauceNAO查询失败 自动尝试ascii2d查询')
                    }
                    if (similarity < 60) {
                        msg.reply(await a2dSearch(message.url, imageMd5, logger)).then(v => autoRemove(v))
                    }
                }
            })
            if (searchImageFlag[msg.sender.id.toString()]) delete searchImageFlag[msg.sender.id.toString()]
        } else if (A2dFlag[msg.sender.id.toString()]) {
            msg.messageChain.forEach(async message => {
                if (message.type === 'Image') {
                    const imageMd5 = message.url.match(/\-([^-\/]{32})/)[1]
                    msg.reply(await a2dSearch(message.url, imageMd5, logger)).then(v => autoRemove(v))
                }
            })
            if (A2dFlag[msg.sender.id.toString()]) delete A2dFlag[msg.sender.id.toString()]
        }
    })
}
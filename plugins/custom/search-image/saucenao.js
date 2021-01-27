const { getImage, getAdLink } = require('../../utils')
const sagiri = require('sagiri')
const { Message } = require('mirai-ts')

// 格式化saucenao结果
async function formatResult(result) {
    const r = [
        await getImage(result.thumbnail),
        Message.Plain(
            `\n相似度：${result.similarity}` +
            `\n站点：${result.site}` +
            `\n链接：${await getAdLink(result.url)}` +
            `\n作者：${result.authorName || "未知"}` +
            '\n------------\n'
        )
    ]
    return r
}

/**
 * 
 * @param {Number} maxLength 
 * @param {String[]} token 
 * @param {Object} options 
 */
module.exports = (maxLength, token, options) => {
    const client = token.map(v => {
        return sagiri(v, options)
    })
    let tokenIndex = 0
    return async (url) => {
        const result = await client[tokenIndex](url)
        if (tokenIndex === client.length - 1) {
            tokenIndex = 0
        } else {
            tokenIndex++
        }
        let content = []
        let num = 0
        for (let i = 0; i < (result.length > maxLength ? maxLength : result.length); i++) {
            if (result[0].similarity < 40) break
            content = content.concat(await formatResult(result[i]))
            num++
        }
        if (content.length == 0) throw new Error('无结果')
        content = content.concat(Message.Plain(`${num}个结果 Script by：老森`))
        return {
            content,
            similarity: result[0].similarity
        }
    }
}

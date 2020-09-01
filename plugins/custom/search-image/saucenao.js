const { getImage } = require('../../utils');
const sagiri = require('sagiri');
const { Message } = require('mirai-ts');

// 格式化saucenao结果
async function formatResult(result) {
    const r = [
        await getImage(result.thumbnail),
        Message.Plain(`\n相似度：${result.similarity}`),
        Message.Plain(`\n站点：${result.site}`),
        Message.Plain(`\n链接：${result.url}`),
        Message.Plain(`\n作者：${result.authorName || "未知"}`),
        Message.Plain('\n------------\n'),
    ];
    return r;
}


module.exports = (maxLength, token, options) => {
    const client = sagiri(token,options);
    return async (url) => {
        const result = await client(url);
    let content = [];
    for (let i = 0; i < (result.length > maxLength ? maxLength : result.length); i++) {
        content = content.concat(await formatResult(result[i]));
    }
    content = content.concat(Message.Plain(`${result.length > maxLength ? maxLength : result.length}个结果`));
    return {
        content,
        similarity: result[0].similarity
    };
    };
}

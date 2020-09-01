const { searchByUrl } = require('ascii2d');
const { getImage } = require('../../utils');
const { Message,log } = require('mirai-ts');

// 格式化结果
async function formatResult(item) {
    const r = [
        await getImage(item.thumbnailUrl),
        Message.Plain(`\n标题：${item.source.title}`),
        Message.Plain(`\n站点：${item.source.type}`),
        Message.Plain(`\n链接：${item.source.url}`),
        Message.Plain('\n------------\n'),
    ];
    return r;
}


module.exports = async (url) => {
    let content = [];
    content = content.concat(Message.Plain('特徴検索\n'));
    try {
        const resultb = await searchByUrl(url,'bovw');
        content = content.concat(await formatResult(resultb.items[0]));
    } catch (e) {
        log.warning(e);
        content = content.concat(Message.Plain('失败\n'));
        
    }
    content = content.concat(Message.Plain('色合検索\n'));
    try {
        const resultc = await searchByUrl(url,'color');
        content = content.concat(await formatResult(resultc.items[0]));
    } catch {
        content = content.concat(Message.Plain('失败\n'));
    }
    content = content.concat(Message.Plain('Script by：老森'));
    return content;
}


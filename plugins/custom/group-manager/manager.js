const { default: Bot } = require("el-bot");
const { check } = require('mirai-ts');
const base64 = require('node-base64-image');
const fetch = require('node-fetch').default;
const { ObjectID } = require('mongodb');
const token = Symbol('token');
const collection = Symbol('collection');
const options = Symbol('options');
const mute = Symbol('mute');
const logger = Symbol('logger');
const api = Symbol('api');
const cache = Symbol('cache');
module.exports = class {
    /**
     * 管理器类
     * @param {Bot} ctx 
     * @param {Object} opt 
     */
    constructor(ctx, opt) {
        const { db } = ctx;
        this[options] = opt;
        this[api] = ctx.mirai.api;
        this[cache] = { i: 0 };
        this[logger] = ctx.logger;
        // 关键词数据库集合
        this[collection] = db.collection('blackKeyword');
        // 初始化数据库
        this[collection].find().count().then(data => {
            if (data == 0) {
                this[collection].createIndex(
                    {
                        keyword: 1,
                        type: 1
                    },
                    {
                        unique: true
                    }
                ).then(() => {
                    // 写入默认数据
                    this[collection].insertOne(
                        {
                            keyword: { includes: ['软件', '下载'] },
                            type: 'includes'
                        }
                    );
                });
                this[logger].success('新建Collection: blackKeyword');
            }
        })
    }
    /**
     * OCR识别-baidu api
     * @param {String} url 
     */
    async ocr(url) {
        if (!this[token] || !this[token].token || !this[token].time || this[token].time < Math.floor(Date.now() / 1000)) {
            const r = await fetch(`https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${this[options].apiKey}&client_secret=${this[options].secretKey}`).then(res => res.text());
            const j = JSON.parse(r);
            this[token] = {};
            this[token].token = j.access_token;
            this[token].time = Math.floor(Date.now / 1000) + j.expires_in;
        }
        const response = await fetch(url);
        const imageType = response.headers.get('Content-Type');
        if (!imageType || imageType === 'image/gif') {
            return null;
        }
        const result = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${this[token].token}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `url=${url}`
        }).then(res => res.text());
        const json = JSON.parse(result);
        if (!json.words_result || json.words_result.length === 0) {
            return null
        }
        let res = '';
        for (let i = 0; i < json.words_result.length; i++) {
            res = res + json.words_result[i].words;
        }
        return res;
    }
    /**
     * 消息检查
     * @param {import('mirai-ts').MessageType.ChatMessage} msg 
     */
    async check(msg) {
        const keywords = await this[collection].find().toArray();
        let imageMd5 = '';
        keywords.map(v => {
            if (check.match(msg.plain, v.keyword)) {
                this[mute](msg, v);
                return;
            } else {
                msg.messageChain.forEach(async singleMessage => {
                    if (singleMessage.type === 'Image') {
                        const md5 = singleMessage.url.match(/\-([^-\/]{32})/)[1]
                        if (imageMd5 !== md5) imageMd5 = md5;
                        if (!this[cache][imageMd5]) {
                            if (this[cache].i > 500) {
                                delete this[cache];
                                this[cache] = { i: 0 };
                            }
                            this[cache][imageMd5] = {};
                            this[cache][imageMd5].text = await this.ocr(singleMessage.url);
                            this[cache].i++;
                        }
                        if (this[cache][imageMd5] && this[cache][imageMd5].text && check.match(this[cache][imageMd5].text, v.keyword)) {
                            this[mute](msg, v);
                        }
                    }
                });
            }
        });
    }
    /**
     * 禁言
     * @param {import('mirai-ts').MessageType.ChatMessage} msg 
     * @param {Object} v 
     */
    [mute](msg, v) {
        let keywordText;
        if (v.keyword.includes) {
            keywordText = Array.isArray(v.keyword.includes) ? v.keyword.includes.join('&') : v.keyword.includes;
        }
        if (v.keyword.re) {
            keywordText = typeof (v.keyword.re) === 'string' ? v.keyword.re : v.keyword.re.pattern;
        }
        if (v.keyword.is) {
            keywordText = Array.isArray(v.keyword.includes) ? v.keyword.is.join('/') : v.keyword.is;
        }
        this[api].mute(msg.sender.group.id, msg.sender.id, (v.meta && v.meta.muteTime) || this[options].muteTime).then(res => {
            if (res.code === 0) {
                msg.reply(`检测到关键词: ${keywordText},type: ${v.type} 予以处罚`);
            }
        });
    }
    /**
     * 向数据库添加关键词
     * @param {String} keyword 
     * @param {String} type 
     * @returns {Promise<import("mongodb").InsertOneWriteOpResult>}
     */
    async addKeyword(keyword, type) {
        let r;
        switch (type) {
            case 'includes':
                const keywordArray = keyword.split('|');
                if ((await this[collection].find({ keyword: { includes: keywordArray }, type }).count()) > 0) throw new Error('已存在');
                r = await this[collection].insertOne(
                    {
                        keyword: { includes: keywordArray },
                        type
                    }
                );
                break;
            case 're':
                if ((await this[collection].find({ keyword: { re: keyword }, type }).count()) > 0) throw new Error('已存在');
                r = await this[collection].insertOne(
                    {
                        keyword: { re: keyword },
                        type
                    }
                );
                break;
            case 'is':
                if ((await this[collection].find({ keyword: { is: keyword }, type }).count()) > 0) throw new Error('已存在');
                r = await this[collection].insertOne(
                    {
                        keyword: { is: keyword },
                        type
                    }
                );
            default:
                throw new Error('类型错误');
        }
        return r;
    }
    /**
     * 设置关键词元数据
     * @param {String} id 
     * @param {Object} meta 
     */
    async setKeywordMeta(id, meta) {
        const _id = new ObjectID(id);
        const r = await this[collection].updateOne({ _id }, { $set: { meta } });
        return r;
    }
};
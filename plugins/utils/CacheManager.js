const { default: Bot } = require("el-bot");
const schedule = require('node-schedule');
const fs = require('fs');
const logger = Symbol('logger');
const imageCache = Symbol('imageCache');
const timer = Symbol('timer');
const dir = './mirai/data/MiraiAPIHTTP/images';

class CacheManager {
    /**
     * 搜图缓存管理器
     * @param {Bot} ctx 
     */
    constructor(ctx) {
        const db = ctx.db;
        const config = ctx.el.config;
        const cron = (config.cache && config.cache.cron) || undefined;
        this[logger] = ctx.logger;
        this[imageCache] = db.collection('imageCache');
        this[imageCache].find().count().then(data => {
            if (data == 0) { // 如果为空则初始化
                this[imageCache].createIndex(
                    {
                        imageMd5: 1,
                        date: 1,
                        type: 1,
                        // similarity: 1,
                        // msg: 1,
                    },
                    {
                        unique: true
                    },
                    err => {
                        if (err) {
                            this[logger].error('[cache-manager] 初始化数据库失败')
                            throw err;
                        }
                        this[logger].success('[cache-manager] 初始化数据库完成');
                    }
                );
            }
        });
        if (cron) this[timer](cron);
    }
    /**
     * 获取实例 单例模式
     * @param {Bot} ctx 
     * @returns {CacheManager}
     */
    static getInstance(ctx) {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(ctx);
        }
        return CacheManager.instance;
    }
    /**
     * 设置定时器
     * @param {String|Date} cron 
     */
    [timer](cron) {
        this[logger].success('[cache-manager] 定时器开始工作');
        schedule.scheduleJob(cron, () => {
            this.flushCache();
        });
    }
    /**
     * 清空缓存
     */
    flushCache() {
        this[imageCache].deleteMany({}, err => {
            if (err) {
                this[logger].error(`[cache-manager] ${err.message}`);
                return;
            }
            this[logger].success('[cache-manager] 已清空数据库中的缓存条目');
            fs.readdir(dir, (err, files) => {
                if (err) {
                    this[logger].error('[cache-manager] 图片文件列表读取失败');
                    return;
                }
                files.map(file => {
                    fs.unlinkSync(`${dir}/${file}`);
                });
                this[logger].success('[cache-manager] 已清空图片临时文件');
            });
        });
    }
    /**
     * 获取缓存
     * @param {String} imageMd5 
     * @param {String} type 
     */
    async getCache(imageMd5, type) {
        try {
            const r = await this[imageCache].findOne({
                imageMd5,
                type
            });
            return r;
        } catch (e) {
            this[logger].error('[cache-manager] 缓存读取失败');
            return;
        }
    }
    /**
     * 写入缓存
     * @param {String} imageMd5 
     * @param {String} type 
     * @param {import('mirai-ts').MessageType.MessageChain} msg 
     * @param {Number} similarity 
     */
    setCache(imageMd5, type, msg, similarity = 0) {
        this[imageCache].insertOne(
            {
                imageMd5,
                date: Math.floor(Date.now() / 1000),
                type,
                similarity,
                msg
            },
            err => {
                if (err) {
                    this[logger].error(`[cache-manager] ${err.message}`);
                    return;
                }
                this[logger].success("[cache-manager] 缓存成功");
            }
        );
    }
}
module.exports = CacheManager;
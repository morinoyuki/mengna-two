const { default: Bot } = require("el-bot");
const schedule = require('node-schedule');
const ImageCache = require('./cache.schema').ImageCache;
const fs = require('fs');
const logger = Symbol('logger');
// const imageCache = Symbol('imageCache');
const timer = Symbol('timer');
const qq = Symbol('qq');
const dir = './mcl/data/net.mamoe.mirai-api-http/images';

class CacheManager {
    /**
     * 搜图缓存管理器
     * @param {Bot} ctx 
     */
    constructor(ctx) {
        const db = ctx.db;
        const config = ctx.el.bot;
        const cron = (config.cache && config.cache.cron) || undefined;
        this[logger] = ctx.logger;
        this[qq] = ctx.el.qq;
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
        ImageCache.deleteMany({ bot: this[qq] }, err => {
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
                files.forEach(file => {
                    if (fs.statSync(`${dir}/${file}`).isFile())
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
            const r = await ImageCache.findOne({
                imageMd5,
                type,
                bot: this[qq]
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
     * @param {*} msg 
     * @param {Number} similarity 
     */
    setCache(imageMd5, type, msg, similarity = 0) {
        const imageCache = new ImageCache(
            {
                imageMd5,
                date: Date.now(),
                type,
                similarity,
                bot: this[qq],
                msg
            }
        );
        imageCache.save(err => {
            if (err) {
                this[logger].error(`[cache-manager] ${err.message}`);
                return;
            }
            this[logger].success("[cache-manager] 缓存成功");
        })
    }
}
module.exports = CacheManager;
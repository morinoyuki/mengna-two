require("dotenv").config();
const { resolve } = require("path");
const { utils } = require("el-bot");

module.exports = {
  qq: parseInt(process.env.BOT_QQ),
  // 你可以直接解析 mirai-api-http 的配置
  setting: utils.config.parse(
    resolve(__dirname, "../mirai/config/MiraiAPIHTTP/net.mamoe.mirai.api.http.config.Setting")
  ),
  // setting: {
  //   enableWebsocket: false
  // },
  config: utils.config.parse(resolve(__dirname, "./index.yml")),
  // webhook
  webhook: {
    path: "/webhook",
    port: 7777,
    secret: "14gd4erujr5yht5ijg",
  },
};

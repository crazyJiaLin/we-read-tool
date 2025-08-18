'use strict';

module.exports = {
  // use for cookie sign key, should change to your own and keep security
  keys: 'we-read-tool-keys',
  koa: {
    port: 7001,
    cors: {
      origin: '*',
      allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
    },
  },
  mongoose: {
    dataSource: {
      default: {
        uri: 'mongodb://localhost:27017/weread',
        options: {
          // 本地MongoDB配置，无需用户名密码
        },
      },
    },
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
  },
  weRead: {
    baseUrl: 'https://weread.qq.com',
    timeout: 10000,
    // MCP服务配置
    mcpServer: {
      host: 'localhost',
      port: 3001, // MCP服务默认端口
      protocol: 'http',
    },
  },
};

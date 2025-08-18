import { MidwayConfig } from '@midwayjs/core';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// 根据当前环境加载对应的 .env 文件
const env = process.env.RUN_ENV || 'production';
const envFilePath = path.resolve(__dirname, `../../.env.${env}`);
dotenv.config({
  path: fs.existsSync(envFilePath)
    ? envFilePath
    : path.resolve(__dirname, '../../.env'),
});

const { SECURITY_KEY } = process.env;

const loggerLevel = env === 'local' ? 'debug' : 'info';
export default {
  // use for cookie sign key, should change to your own and keep security
  keys: SECURITY_KEY,
  koa: {
    port: 7001,
  },
  // 其他配置项
  midwayLogger: {
    default: {
      // 日志文件路径
      dir: path.join(__dirname, '../../logs'),
      // 日志级别
      level: loggerLevel,
      // 是否启用控制台输出
      consoleLevel: loggerLevel,
    },
    clients: {
      appLogger: {
        fileLogName: 'app.log',
        level: loggerLevel,
        consoleLevel: loggerLevel,
      },
      errorLogger: {
        fileLogName: 'app.log',
        level: 'warn',
        consoleLevel: 'warn',
      },
    },
  },
  validate: {
    validationOptions: {
      stripUnknown: true,
    },
    errorStatus: 200,
    errorCode: 400,
    errorMessage: '参数校验失败',
    locale: {
      'string.uri': '链接格式不正确',
      'any.required': '${label}不能为空',
      'number.base': '${label}必须是数字',
      'number.min': '${label}不能小于${limit}',
      'number.max': '${label}不能大于${limit}',
    },
  },
  moonshot: {
    apiKey: process.env.MOONSHOT_API_KEY || 'sk-yVK2YRXuvPoeGqpBl1P2tBKXS14mhY7V9qX4R8TsJTDmvNq9',
    apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
    model: 'moonshot-v1-8k',
  },
  weRead: {
    baseUrl: 'https://weread.qq.com',
    timeout: 10000,
  },
} as MidwayConfig;

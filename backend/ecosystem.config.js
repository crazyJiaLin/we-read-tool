const path = require('path');
const logDir = path.join(__dirname, 'logs');

module.exports = {
  apps: [
    {
      name: 'jarvis',
      script: './bootstrap.js',
      env: {
        NODE_ENV: 'production',
      },
      log_file: path.join(logDir, 'pm2-combined.log'), // 组合日志文件
      out_file: path.join(logDir, 'pm2-out.log'), // 标准输出日志文件
      error_file: path.join(logDir, 'pm2-error.log'), // 错误日志文件
      merge_logs: true, // 合并日志
      log_date_format: 'YYYY-MM-DD HH:mm Z', // 日志日期格式
    },
  ],
};

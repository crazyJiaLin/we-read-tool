const { Bootstrap } = require('@midwayjs/bootstrap');

// 启动应用
Bootstrap.run()
  .then(() => {
    console.log('Server started successfully!');
  })
  .catch(err => {
    console.error('Server failed to start:', err);
  });

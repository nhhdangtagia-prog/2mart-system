module.exports = {
  apps: [
    {
      name: '2mart-api',
      script: 'C:\\Program Files\\nodejs\\node.exe',
      args: 'node_modules/tsx/dist/cli.mjs index.ts',
      cwd: __dirname,
      interpreter: 'none',
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};

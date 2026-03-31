module.exports = {
  apps: [
    {
      name: 'moneymind-ai-backend',
      script: 'src/app.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Add MongoDB production URI or other variables inside .env on the server
      },
    },
  ],
};

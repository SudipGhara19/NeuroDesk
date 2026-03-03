module.exports = {
  apps: [
    {
      name: 'neurodesk-backend',
      script: './neuro-desk-backend/index.js',
      instances: 1, // Change to 'max' for cluster mode if deploying heavily
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development'
      },
      env_production: {
        NODE_ENV: 'production'
      }
    },
    {
      name: 'neurodesk-frontend',
      script: 'npm',
      args: 'start',
      cwd: './neuro-desk',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'development',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};

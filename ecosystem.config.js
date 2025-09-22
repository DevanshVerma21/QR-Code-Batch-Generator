module.exports = {
  apps: [
    {
      name: "railway-qr-backend",
      script: "app.py",
      interpreter: "python3",
      env: {
        FLASK_ENV: "production",
        PORT: "5000",
        DATABASE_PATH: "./data/qr_records.db"
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
      time: true
    },
    {
      name: "railway-qr-frontend",
      script: "node_modules/next/dist/bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: "3000",
        NEXT_PUBLIC_API_URL: "http://localhost:5000"
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true
    }
  ]
};
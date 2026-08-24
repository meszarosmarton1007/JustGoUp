const PROXY_CONFIG = [
  {
    context: [
      "/api"
    ],
    target: "https://localhost:7043", // Itt a C# HTTPS portodnak kell lennie!
    secure: false,
    headers: {
      Connection: 'Keep-Alive'
    }
  }
]

module.exports = PROXY_CONFIG;

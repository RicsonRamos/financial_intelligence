import app from './app.js';

const PORT = process.env.PORT || 3000;

/**
 * Standard Server Bootstrap
 */
app.listen(PORT, () => {
  console.log(`\n🚀 Financial Intelligence API is running!`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🛠️ Mode: DEVELOPMENT`);
  console.log(`🔑 Auth: Use 'x-user-id' (UUID v4) for multi-tenancy testing\n`);
});

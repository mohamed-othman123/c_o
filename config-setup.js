const fs = require('fs');
const path = require('path');

function copyConfigFile() {
  const env = process.env.APP_ENV || 'config';
  if (env === 'config') return true;
  const assetsPath = path.join(__dirname, 'apps', 'ebanking-portal', 'public', 'config');
  const defaultConfig = path.join(assetsPath, 'config.json');

  const envConfig = path.join(assetsPath, `${env}.json`);

  try {
    // Check if environment-specific config exists
    if (!fs.existsSync(envConfig)) {
      console.error(`Configuration file for environment ${env} not found`);
      process.exit(1);
    }

    // Read environment-specific config
    const configContent = fs.readFileSync(envConfig);

    // Write to config.json
    fs.writeFileSync(defaultConfig, configContent);
    console.log(`Successfully copied ${env}.json to config.json`);
  } catch (error) {
    console.error('Error copying configuration:', error);
    process.exit(1);
  }
}

// Execute the function
copyConfigFile();

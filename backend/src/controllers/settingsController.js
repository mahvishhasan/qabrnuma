const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../config/settings.json');

const getSettings = async (req, res) => {
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const settings = JSON.parse(data);
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to read settings' });
  }
};

const updateSettings = async (req, res) => {
  try {
    const data = fs.readFileSync(SETTINGS_PATH, 'utf8');
    const currentSettings = JSON.parse(data);

    const updatedSettings = {
      ...currentSettings,
      ...req.body,
    };

    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(updatedSettings, null, 2));

    res.json({
      message: 'Settings updated successfully',
      settings: updatedSettings,
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

module.exports = { getSettings, updateSettings };

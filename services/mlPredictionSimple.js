const { spawn } = require('child_process');
const path = require('path');

class SimpleMLPrediction {
  constructor() {
    this.pythonPath = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    this.scriptPath = path.join(__dirname, '../dataset_model/predict_from_cli.py');
  }

  predict(propertyData) {
    return new Promise((resolve, reject) => {
      // Spawn Python process in the dataset_model directory
      const pythonProcess = spawn(this.pythonPath, [
        this.scriptPath,
        JSON.stringify(propertyData)
      ], {
        cwd: path.join(__dirname, '../dataset_model')
      });

      let output = '';
      let errorOutput = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0 && output) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            reject(new Error('Failed to parse Python output: ' + output));
          }
        } else {
          reject(new Error(errorOutput || 'Python process failed'));
        }
      });
    });
  }
}

module.exports = new SimpleMLPrediction();

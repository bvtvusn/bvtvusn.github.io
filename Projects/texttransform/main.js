// Define the Setting class
class Setting {
  constructor(name, dataType, value, options = []) {
    this.name = name;
    this.dataType = dataType;
    this.value = value;
    this.options = options;
  }
}

// Define the iTransformer interface

// Base transformer class
class Transformer {
  constructor() {
    this.settings = [];
	this.id = Date.now(); 
  }

  transform(input) {
    // To be implemented by the concrete transformer classes
  }

  renderSettingsUI(container) {
    this.settings.forEach(setting => {
      const settingElement = document.createElement('input');
      settingElement.type = 'text';
      settingElement.value = setting.value;
      settingElement.id = setting.name.replace(/\s+/g, '_') + 'Setting'; // Unique ID

      const label = document.createElement('label');
      label.textContent = `${setting.name}: `;
      label.appendChild(settingElement);

      container.appendChild(label);
    });
  }

  applySettings() {
    this.settings.forEach(setting => {
      const settingElement = document.getElementById(`ReplaceTransformer_${this.id}_${setting.name.replace(/\s+/g, '_')}Setting`);
      if (settingElement) {
        setting.value = settingElement.value;
      }
    });
  }
}

// Concrete transformer class: ReplaceTransformer
class ReplaceTransformer extends Transformer {
  constructor() {
    super();
    this.settings.push(new Setting('Find Text', 'string', 'cat'));
    this.settings.push(new Setting('Replace Text', 'string', 'dog'));
  }

  transform(input) {
    const findText = this.settings.find(s => s.name === 'Find Text').value;
    const replaceText = this.settings.find(s => s.name === 'Replace Text').value;
    return input.replace(new RegExp(findText, 'g'), replaceText);
  }
}

// Concrete transformer class: DuplicateTransformer
class DuplicateTransformer extends Transformer {
  constructor() {
    super();
    this.settings.push(new Setting('Duplicate Count', 'integer', 2));
  }

  transform(input) {
    const duplicateCount = this.settings.find(s => s.name === 'Duplicate Count').value;
    return input.split('').map(char => char.repeat(duplicateCount)).join('');
  }
}

class ReverseTransformer extends Transformer {
  constructor() {
    super();
    // Reverse transformer doesn't have specific settings
  }

  transform(input) {
    return input.split('').reverse().join('');
  }
}

// Main application logic
const addTransformerButtonsContainer = document.getElementById('addTransformerButtonsContainer');
const transformersContainer = document.getElementById('transformersContainer');
const outputTextElement = document.getElementById('outputText');
const transformers = [];

// Function to add a transformer button
function addTransformerButton(transformerType) {
  const button = document.createElement('button');
  button.textContent = `Add ${transformerType} Transformer`;
  button.onclick = () => addTransformer(transformerType);
  addTransformerButtonsContainer.appendChild(button);
}

// Function to add a transformer to the chain
function addTransformer(transformerType) {
  let transformer;
  switch (transformerType) {
    case 'Replace':
      transformer = new ReplaceTransformer();
      break;
    case 'Duplicate':
      transformer = new DuplicateTransformer();
      break;
    case 'Reverse':
      transformer = new ReverseTransformer();
      break; // Add the case for the new transformer type

    // Add more transformer types as needed
    default:
      console.error(`Unknown transformer type: ${transformerType}`);
  }

  // Clone the settings array to ensure independence
  transformer.settings = transformer.settings.map(setting => ({ ...setting }));

  transformers.push(transformer);
  updateTransformerButtonsAndSettings();
}

// Function to remove a transformer from the chain
function removeTransformer(index) {
  transformers.splice(index, 1);
  updateTransformerButtonsAndSettings();
}

// ... (previous code) ...

// Function to update transformer buttons and settings
function updateTransformerButtonsAndSettings() {
  const transformersContainer = document.getElementById('transformersContainer');
  transformersContainer.innerHTML = '';

  transformers.forEach(transformer => {
    const transformerDiv = document.createElement('div');
    transformerDiv.className = 'transformer';

    const transformerHeader = document.createElement('div');
    transformerHeader.className = 'transformerHeader';
    transformerHeader.textContent = transformer.constructor.name;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => removeTransformer(transformer);

    transformerHeader.appendChild(removeButton);
    transformerDiv.appendChild(transformerHeader);

    // Create settings UI
    const settingsDiv = document.createElement('div');
    settingsDiv.className = 'settings';

    transformer.settings.forEach(setting => {
      const settingLabel = document.createElement('label');
      settingLabel.textContent = setting.name;

      const settingInput = document.createElement('input');
      settingInput.type = 'text';
      settingInput.value = setting.value;
      settingInput.id = `${transformer.constructor.name}_${transformer.id}_${setting.name.replace(/\s+/g, '_')}Setting`;

      settingLabel.appendChild(settingInput);
      settingsDiv.appendChild(settingLabel);
    });

    transformerDiv.appendChild(settingsDiv);

    transformersContainer.appendChild(transformerDiv);
  });
}

// ... (rest of the code) ...


// Function to perform text transformation
function transformText() {
  const inputText = document.getElementById('inputText').value;

  // Apply transformations
  let result = inputText;
  transformers.forEach(transformer => {
    transformer.applySettings(); // Update settings before transforming
    result = transformer.transform(result);
  });

  // Display the final result
  outputTextElement.value = result;
}

// ... (previous code) ...

// Function to export user settings
function exportSettings() {
  const exportedSettings = {
    transformers: transformers.map(transformer => {
      return {
        type: transformer.constructor.name,
        settings: transformer.settings.map(setting => {
          return {
            name: setting.name,
            dataType: setting.dataType,
            value: setting.value,
            options: setting.options,
          };
        }),
      };
    }),
  };

  const exportedSettingsJSON = JSON.stringify(exportedSettings, null, 2);

  // Display the exported settings in a new window
  const exportWindow = window.open('', 'Exported Settings', 'width=600,height=400');
  exportWindow.document.open();
  exportWindow.document.write(`<pre>${exportedSettingsJSON}</pre>`);
  exportWindow.document.close();
}

function importSettings() {
  const importSettingsJSON = prompt('Paste the exported settings JSON here:');

  if (importSettingsJSON) {
    try {
      const importedSettings = JSON.parse(importSettingsJSON);

      if (!importedSettings || !Array.isArray(importedSettings.transformers)) {
        throw new Error('Invalid settings structure.');
      }

      // Clear existing transformers
      transformers.length = 0;

      // Create transformers from imported settings
      importedSettings.transformers.forEach(importedTransformer => {
        let transformer;
        switch (importedTransformer.type) {
          case 'ReplaceTransformer':
            transformer = new ReplaceTransformer();
            break;
          case 'DuplicateTransformer':
            transformer = new DuplicateTransformer();
            break; // Add the case for the new transformer type

          // Add more transformer types as needed
          default:
            console.error(`Unknown transformer type: ${importedTransformer.type}`);
            return; // Skip unknown transformer types
        }

        transformer.settings.forEach((importedSetting, index) => {
          // Update the settings with imported values
          if (transformer.settings[index] && importedSetting) {
            transformer.settings[index].value = importedSetting.value;
          }
        });

        transformers.push(transformer);
      });

      updateTransformerButtonsAndSettings();
    } catch (error) {
      console.error('Error importing settings:', error);
      alert('Error importing settings. Please make sure the provided JSON is valid.');
    }
  }
}



// Initial setup - Add transformer buttons
addTransformerButton('Replace');
addTransformerButton('Duplicate');
addTransformerButton('Reverse');
// Add more transformer buttons as needed

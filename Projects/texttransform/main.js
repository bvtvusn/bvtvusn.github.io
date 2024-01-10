// Define the SelectionRange class
class SelectionRange {
  constructor(start, end) {
    this.start = start;
    this.end = end;
  }
}

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
	static displayName = 'Transformer'; // Default display name
  constructor() {
    this.settings = [];
	this.id = Date.now(); 
  }

  transform(fullText, selectedRanges) {
    // To be implemented by the concrete transformer classes
    // Default behavior: Apply transformation to the entire text
    return fullText;
  }
  

  applySettings() {
    this.settings.forEach(setting => {
      const settingElement = document.getElementById(
        `${this.constructor.name}_${this.id}_${setting.name.replace(/\s+/g, '_')}Setting`
      );
      if (settingElement) {
        setting.value = settingElement.value;
      }
    });
  }
}

// Concrete transformer class: ReplaceTransformer
class ReplaceTransformer extends Transformer {
  static displayName = 'Replace';
  constructor() {
    super();
    this.settings.push(new Setting('Find Text', 'string', 'cat'));
    this.settings.push(new Setting('Replace Text', 'string', 'dog'));
  }

  transform(input, selectedRanges) {
    const findText = this.settings.find(s => s.name === 'Find Text').value;
    const replaceText = this.settings.find(s => s.name === 'Replace Text').value;

    selectedRanges.forEach(range => {
      const start = range.start;
      const end = range.end;
      const selectedText = input.substring(start, end);
      const replacedText = selectedText.replace(new RegExp(findText, 'g'), replaceText);
      input = input.substring(0, start) + replacedText + input.substring(end);
    });

    return { text: input, selectedRanges };
  }
}



// Concrete transformer class: DuplicateTransformer
class DuplicateTransformer extends Transformer {
  static displayName = 'Duplicate';
  constructor() {
    super();
    this.settings.push(new Setting('Duplicate Count', 'integer', 2));
  }

  transform(input, selectedRanges) {
    const duplicateCount = this.settings.find(s => s.name === 'Duplicate Count').value;

    selectedRanges.forEach(range => {
      const start = range.start;
      const end = range.end;
      const selectedText = input.substring(start, end);
      const duplicatedText = selectedText.split('').map(char => char.repeat(duplicateCount)).join('');
      input = input.substring(0, start) + duplicatedText + input.substring(end);
    });

    // Select everything after transformation
    const newEnd = input.length;
    return { text: input, selectedRanges: [{ start: 0, end: newEnd }] };
  }
}



// Concrete transformer class: ReverseTransformer
class ReverseTransformer extends Transformer {
  static displayName = 'Reverse';
  constructor() {
    super();
    // Reverse transformer doesn't have specific settings
  }

  transform(input, selectedRanges) {
    let result = input;
    let newSelectedRanges = [];

    selectedRanges.forEach(range => {
      const start = range.start;
      const end = range.end;
      const selectedText = result.substring(start, end);
      const reversedText = selectedText.split('').reverse().join('');
      result = result.substring(0, start) + reversedText + result.substring(end);

      // Update the selected ranges based on the transformation
      const newStart = start;
      const newEnd = newStart + selectedText.length;
      newSelectedRanges.push({ start: newStart, end: newEnd });
    });

    return { text: result, selectedRanges: newSelectedRanges };
  }
}


// Concrete transformer class: EscapeUrlTransformer
class EscapeUrlTransformer extends Transformer {
  static displayName = 'Escape URL';
  constructor() {
    super();
  }

  transform(input, selectedRanges) {
    let result = input;
    let newSelectedRanges = [];

    selectedRanges.forEach(range => {
      const start = range.start;
      const end = range.end;
      const selectedText = result.substring(start, end);
      const escapedText = escape(selectedText);
      result = result.substring(0, start) + escapedText + result.substring(end);

      // Update the selected ranges based on the transformation
      const newStart = start;
      const newEnd = newStart + escapedText.length;
      newSelectedRanges.push({ start: newStart, end: newEnd });
    });

    return { text: result, selectedRanges: newSelectedRanges };
  }
}



class UnescapeUrlTransformer extends Transformer {
  static displayName = 'Unescape URL';
  constructor() {
    super();
  }

  transform(input, selectedRanges) {
    let result = input;
    let newSelectedRanges = [];

    selectedRanges.forEach(range => {
      const start = range.start;
      const end = range.end;
      const selectedText = result.substring(start, end);
      const unescapedText = unescape(selectedText);
      result = result.substring(0, start) + unescapedText + result.substring(end);

      // Update the selected ranges based on the transformation
      const newStart = start;
      const newEnd = newStart + unescapedText.length;
      newSelectedRanges.push({ start: newStart, end: newEnd });
    });

    return { text: result, selectedRanges: newSelectedRanges };
  }
}


class CaseConverterTransformer extends Transformer {
  static displayName = 'Case Converter';

  constructor() {
    super();
    this.settings.push(new Setting('Case Type', 'select', 'lowercase', ['lowercase', 'uppercase', 'titlecase']));
	
	
	//this.runTest();
  }

  runTest() {
    // Sample text for testing
    const sampleText = 'THIS is a Sample Text';

    // Convert the sample text using the current settings
    const transformedText = this.transform(sampleText, [{ start: 0, end: sampleText.length }]);

//console.log(`Test Result for ${this.constructor.displayName}:`, transformedText.text);
    // Log the result to the console
    console.log(`Test Result for ${this.constructor.displayName}:`, transformedText.text);
  }
  
  transform(input, selectedRanges) {
	  //console.log('JSON in case transform::', JSON.stringify(selectedRanges));
    const caseType = this.settings.find(s => s.name === 'Case Type').value;

    if (!Array.isArray(selectedRanges) || selectedRanges.length === 0) {
      // No selected text, return the original input
      return { text: input, selectedRanges: [] };
    }

    let transformedText = '';

    // Build the transformed text based on selected ranges
    let lastIndex = 0;
    selectedRanges.forEach(range => {
      const { start, end } = range;
	  
      const unselectedText = input.substring(lastIndex, start);
      const selectedText = input.substring(start, end);

      // Apply case conversion to the selected range
      let convertedText;
      switch (caseType) {
        case 'lowercase':
          convertedText = selectedText.toLowerCase();
          break;
        case 'uppercase':
          convertedText = selectedText.toUpperCase();
          break;
        case 'titlecase':
          convertedText = selectedText.replace(/\w\S*/g, word =>
            word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()
          );
          break;
        default:
          // Do nothing for unknown case types
          convertedText = selectedText;
      }

      transformedText += unselectedText + convertedText;
      lastIndex = end;
	
    });

    // Append any remaining unselected text
    transformedText += input.substring(lastIndex);
    return { text: transformedText, selectedRanges };
  }
}






class SelectTextTransformer extends Transformer {
  static displayName = 'Select Text';

  constructor() {
    super();
    this.settings.push(new Setting('Text to Select', 'string', ''));
    this.settings.push(new Setting('Case Sensitivity', 'select', 'caseSensitive', ['caseSensitive', 'caseInsensitive']));
    this.settings.push(new Setting('Invert Selection', 'select', 'includeSelected', ['includeSelected', 'excludeSelected']));
  }

  transform(input, selectedRanges) {
    const textToSelect = this.settings.find(s => s.name === 'Text to Select').value;
    const caseSensitivity = this.settings.find(s => s.name === 'Case Sensitivity').value;
    const invertSelection = this.settings.find(s => s.name === 'Invert Selection').value;

    if (textToSelect.length < 1) {
      return { text: input, selectedRanges: [] };
    }

    const flags = caseSensitivity === 'caseSensitive' ? 'g' : 'gi'; // 'g' for global match, 'i' for case-insensitive
    const regex = new RegExp(textToSelect, flags);
    let match;
    const newSelectedRanges = [];

    while ((match = regex.exec(input)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      newSelectedRanges.push({ start, end });
    }

    let finalSelectedRanges = newSelectedRanges;

    if (invertSelection === 'excludeSelected') {
      const fullTextRange = { start: 0, end: input.length };
      finalSelectedRanges = subtractRanges(fullTextRange, newSelectedRanges);
    }

    return {
      text: input,
      selectedRanges: finalSelectedRanges,
    };
  }
}

// Helper function to subtract ranges
function subtractRanges(fullRange, subtractRange) {
  const result = [];
  let start = fullRange.start;

  subtractRange.forEach(subtract => {
    if (subtract.start > start) {
      result.push({ start, end: subtract.start });
    }
    start = subtract.end;
  });

  if (start < fullRange.end) {
    result.push({ start, end: fullRange.end });
  }

  return result;
}


class SelectCharacterTransformer extends Transformer {
  static displayName = 'Select Characters';

  constructor() {
    super();
    this.settings.push(new Setting('Characters to Select', 'string', ''));
    this.settings.push(new Setting('Case Sensitivity', 'select', 'caseSensitive', ['caseSensitive', 'caseInsensitive']));
    this.settings.push(new Setting('Invert Selection', 'select', 'includeSelected', ['includeSelected', 'excludeSelected']));
  }

  transform(input, selectedRanges) {
    const charactersToSelect = this.settings.find(s => s.name === 'Characters to Select').value;
    const caseSensitivity = this.settings.find(s => s.name === 'Case Sensitivity').value;
    const invertSelection = this.settings.find(s => s.name === 'Invert Selection').value;

    if (charactersToSelect.length < 1) {
      return { text: input, selectedRanges: [] };
    }

    const isMatchArray = createMatchArray(input, charactersToSelect, caseSensitivity);

    const newSelectedRanges = createSelectionRanges(input, isMatchArray);

    let finalSelectedRanges = newSelectedRanges;

    if (invertSelection === 'excludeSelected') {
      const fullTextRange = { start: 0, end: input.length };
      finalSelectedRanges = subtractRanges(fullTextRange, newSelectedRanges);
    }

    return {
      text: input,
      selectedRanges: finalSelectedRanges,
    };
  }
}

function createMatchArray(input, charactersToSelect, caseSensitivity) {
  const isMatchArray = new Array(input.length).fill(false);

  const flags = caseSensitivity === 'caseSensitive' ? 'g' : 'gi'; // 'g' for global match, 'i' for case-insensitive
  const regexPattern = charactersToSelect.split('').map(char => escapeRegExp(char)).join('|');
  const regex = new RegExp(`(${regexPattern})`, flags);

  let match;
  while ((match = regex.exec(input)) !== null) {
    const start = match.index;
    const end = start + match[0].length;
    for (let i = start; i < end; i++) {
      isMatchArray[i] = true;
    }
  }

  return isMatchArray;
}

// Helper function to create selection ranges from the boolean array
function createSelectionRanges(input, isMatchArray) {
  const newSelectedRanges = [];
  let isInMatch = false;
  let matchStart = 0;

  for (let i = 0; i < input.length; i++) {
    if (isMatchArray[i]) {
      if (!isInMatch) {
        // Start of a new match
        matchStart = i;
        isInMatch = true;
      }
    } else if (isInMatch) {
      // End of the current match
      const matchEnd = i;
      newSelectedRanges.push({ start: matchStart, end: matchEnd });
      isInMatch = false;
    }
  }

  if (isInMatch) {
    // Handle the case where the last character is part of a match
    const matchEnd = input.length;
    newSelectedRanges.push({ start: matchStart, end: matchEnd });
  }

  return newSelectedRanges;
}
// Helper function to escape special characters for use in a regular expression
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}






class SelectBetweenDelimitersTransformer extends Transformer {
  static displayName = 'Select Between Delimiters';

  constructor() {
    super();
    this.settings.push(new Setting('Delimiter', 'string', ','));
  }

  transform(input) {
    const delimiter = this.settings.find(s => s.name === 'Delimiter').value;
    const delimiterIndexes = [];
    let match;

    // Find all occurrences of the delimiter
    const regex = new RegExp(delimiter, 'g');
    while ((match = regex.exec(input)) !== null) {
      delimiterIndexes.push(match.index);
    }

    const transformedRanges = [];

    for (let i = 0; i < delimiterIndexes.length - 1; i += 2) {
      // Select text between delimiters
      const start = delimiterIndexes[i] + delimiter.length;
      const end = delimiterIndexes[i + 1];
      transformedRanges.push({ start, end, selected: true });
    }

    // Unselected text after the last delimiter
    if (delimiterIndexes.length % 2 === 1) {
      const lastUnselectedStart = delimiterIndexes[delimiterIndexes.length - 1] + delimiter.length;
      const lastUnselectedEnd = input.length;
      transformedRanges.push({ start: lastUnselectedStart, end: lastUnselectedEnd, selected: false });
    }

    return { text: input, selectedRanges: transformedRanges };
  }
}


// Concrete transformer class: InvertSelectionTransformer
class InvertSelectionTransformer extends Transformer {
  static displayName = 'Invert Selection';

  constructor() {
    super();
    // Invert Selection transformer doesn't have specific settings
  }

  transform(input, selectedRanges) {
    if (!Array.isArray(selectedRanges) || selectedRanges.length === 0) {
      // No selected text, select everything
      return { text: input, selectedRanges: [{ start: 0, end: input.length }] };
    }

    // Sort selected ranges to simplify inversion
    selectedRanges.sort((a, b) => a.start - b.start);

    let invertedRanges = [];

    // Select text before the first selected range
    if (selectedRanges[0].start > 0) {
      invertedRanges.push({ start: 0, end: selectedRanges[0].start });
    }

    // Invert the selection between consecutive ranges
    for (let i = 0; i < selectedRanges.length - 1; i++) {
      invertedRanges.push({
        start: selectedRanges[i].end,
        end: selectedRanges[i + 1].start,
      });
    }

    // Select text after the last selected range
    if (selectedRanges[selectedRanges.length - 1].end < input.length) {
      invertedRanges.push({
        start: selectedRanges[selectedRanges.length - 1].end,
        end: input.length,
      });
    }

    return { text: input, selectedRanges: invertedRanges };
  }
}


// Concrete transformer class: DeleteTextTransformer
class DeleteTextTransformer extends Transformer {
  static displayName = 'Delete Text';

  constructor() {
    super();
    // Delete Text transformer doesn't have specific settings
  }

  transform(input, selectedRanges) {
    if (!Array.isArray(selectedRanges) || selectedRanges.length === 0) {
      // No selected text, nothing to delete
      return { text: input, selectedRanges: [] };
    }

    // Sort selected ranges to simplify deletion
    selectedRanges.sort((a, b) => a.start - b.start);

    let result = '';

    // Delete text before the first selected range
    result += input.substring(0, selectedRanges[0].start);

    // Delete text between consecutive selected ranges
    for (let i = 0; i < selectedRanges.length - 1; i++) {
      result += input.substring(selectedRanges[i].end, selectedRanges[i + 1].start);
    }

    // Delete text after the last selected range
    result += input.substring(selectedRanges[selectedRanges.length - 1].end);

    return { text: result, selectedRanges: [] };
  }
}


class DeselectIfTransformer extends Transformer {
  static displayName = 'Deselect If';

  constructor() {
    super();
    this.settings.push(new Setting('Mode', 'select', 'if contains', ['if contains', 'if not contains']));
    this.settings.push(new Setting('String to Check', 'string', ''));
  }

  transform(input, selectedRanges) {
    const mode = this.settings.find(s => s.name === 'Mode').value;
    const stringToCheck = this.settings.find(s => s.name === 'String to Check').value.toLowerCase();

    const newSelectedRanges = selectedRanges.filter(range => {
      const selectedText = input.substring(range.start, range.end).toLowerCase();
      return (mode === 'if not contains' && selectedText.includes(stringToCheck)) ||
             (mode === 'if contains' && !selectedText.includes(stringToCheck));
    });

    return {
      text: input,
      selectedRanges: newSelectedRanges,
    };
  }
}


class SortLinesTransformer extends Transformer {
  static displayName = 'Sort Lines';

  constructor() {
    super();
    this.settings.push(new Setting('Line Separator', 'string', '\n'));
  }

  transform(input, selectedRanges) {
    const lineSeparator = this.settings.find(s => s.name === 'Line Separator').value;

    // Split the input into lines
    const lines = input.split(lineSeparator);

    // Sort the lines alphabetically
    const sortedLines = lines.sort((a, b) => a.localeCompare(b));

    // Join the sorted lines back with the specified separator
    const result = sortedLines.join(lineSeparator);

    // Update selected ranges (no change in selection after sorting)
    const newSelectedRanges = selectedRanges.map(range => ({ ...range }));

    return {
      text: result,
      selectedRanges: newSelectedRanges,
    };
  }
}


class GrowSelectionTransformer extends Transformer {
  static displayName = 'Grow Selection';

  constructor() {
    super();
    this.settings.push(new Setting('Grow Start By', 'integer', 0));
    this.settings.push(new Setting('Grow End By', 'integer', 0));
  }

  transform(input, selectedRanges) {
    console.log('Selected Ranges (Before Conversion):', selectedRanges);

    const growStartBy = parseInt(this.settings.find(s => s.name === 'Grow Start By').value, 10);
    const growEndBy = parseInt(this.settings.find(s => s.name === 'Grow End By').value, 10);
    console.log('Grow Start By:', growStartBy);
    console.log('Grow End By:', growEndBy);

    const newSelectedRanges = [];

    for (let i = 0; i < selectedRanges.length; i++) {
      const range = selectedRanges[i];
      const newRange = {
        start: Math.max(range.start - growStartBy, 0),
        end: Math.min(range.end + growEndBy, input.length),
      };
      newSelectedRanges.push(newRange);
    }

    console.log('Selected Ranges (After Conversion):', newSelectedRanges);

    return {
      text: input,
      selectedRanges: newSelectedRanges,
    };
  }
}







const transformerClasses = [ReplaceTransformer, DuplicateTransformer,ReverseTransformer,EscapeUrlTransformer,UnescapeUrlTransformer,CaseConverterTransformer,SelectTextTransformer , SelectBetweenDelimitersTransformer,InvertSelectionTransformer,DeleteTextTransformer, DeselectIfTransformer,SortLinesTransformer, GrowSelectionTransformer, SelectCharacterTransformer];







function addTransformerButtons() {
  const addTransformerButtonsContainer = document.getElementById('addTransformerButtonsContainer');
  addTransformerButtonsContainer.innerHTML = '';

  transformerClasses.forEach(transformerClass => {
    const button = document.createElement('button');
    button.textContent = `Add ${transformerClass.displayName} Transformer`;
    button.onclick = () => addTransformer(transformerClass);
    addTransformerButtonsContainer.appendChild(button);
  });
}

// Main application logic
const addTransformerButtonsContainer = document.getElementById('addTransformerButtonsContainer');
const transformersContainer = document.getElementById('transformersContainer');
const outputTextElement = document.getElementById('outputText');
const transformers = [];

// Function to add a transformer button


// Function to add a transformer to the chain
function addTransformer(transformerClass) {
  const transformer = new transformerClass();

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

function updateTransformerButtonsAndSettings() {
  const transformersContainer = document.getElementById('transformersContainer');
  transformersContainer.innerHTML = '';

  transformers.forEach(transformer => {
    const transformerDiv = document.createElement('div');
    transformerDiv.className = 'transformer';

    const transformerHeader = document.createElement('div');
    transformerHeader.className = 'transformerHeader';
    transformerHeader.textContent = transformer.constructor.displayName;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.onclick = () => removeTransformer(transformers.indexOf(transformer));

    transformerHeader.appendChild(removeButton);
    transformerDiv.appendChild(transformerHeader);

    // Create settings UI
    const settingsDiv = document.createElement('div');
    settingsDiv.className = 'settings';

    transformer.settings.forEach(setting => {
      const settingContainer = document.createElement('div');
      settingContainer.className = 'settingContainer';

      const settingLabel = document.createElement('label');
      settingLabel.textContent = setting.name;

      let settingInput;

      if (setting.dataType === 'select') {
        settingInput = document.createElement('select');
        setting.options.forEach(option => {
          const optionElement = document.createElement('option');
          optionElement.value = option;
          optionElement.text = option;
          settingInput.add(optionElement);
        });
        settingInput.value = setting.value;
      } else if (setting.dataType === 'boolean') {
        settingInput = document.createElement('input');
        settingInput.type = 'checkbox';
        settingInput.checked = setting.value;
      } else {
        settingInput = document.createElement('input');
        settingInput.type = 'text';
        settingInput.value = setting.value;
      }

      settingInput.id = `${transformer.constructor.name}_${transformer.id}_${setting.name.replace(/\s+/g, '_')}Setting`;
      settingLabel.appendChild(settingInput);
      settingContainer.appendChild(settingLabel);
      settingsDiv.appendChild(settingContainer);
    });

    transformerDiv.appendChild(settingsDiv);
    transformersContainer.appendChild(transformerDiv);
  });
}



// Function to perform text transformation
function transformText() {
  const inputText = document.getElementById('inputText').value;

  // Apply transformations
  let result = inputText;
  let selectedRanges = [{ start: 0, end: inputText.length }]; // Initially, consider the entire text as selected

  transformers.forEach(transformer => {
    transformer.applySettings(); // Update settings before transforming
    console.log(`Applying ${transformer.constructor.displayName} transformer:`);
    console.log('Input Text:', result);
    console.log('Selected Ranges:', selectedRanges);
    
    
    const transformedResult = transformer.transform(result, selectedRanges);
    console.log('Transformed Text:', transformedResult.text);
    console.log('New Selected Ranges:', transformedResult.selectedRanges || selectedRanges);

    result = transformedResult.text;
    selectedRanges = transformedResult.selectedRanges || selectedRanges;
  });

  // Create a temporary container to store formatted text
  const formattedText = [];

  // Generate formatted text
  let lastIndex = 0;
  let colorToggle = false;
  selectedRanges.forEach(range => {
    // Unselected text before the selected range
    const unselectedText = result.substring(lastIndex, range.start);
    if (unselectedText) {
      formattedText.push(`<span style="background-color: #F2F3F4;">${unselectedText}</span>`);
    }

    // Selected text
    const selectedText = result.substring(range.start, range.end);
	if (colorToggle){
		formattedText.push(`<span style="background-color: yellow;">${selectedText}</span>`);
	}else{
		formattedText.push(`<span style="background-color: #F4D03F;">${selectedText}</span>`);
	}
	
    

    lastIndex = range.end; // Update the last index
	colorToggle = !colorToggle;
  });

  // Unselected text after the last selected range
  const unselectedTextAfter = result.substring(lastIndex);
  if (unselectedTextAfter) {
    formattedText.push(`<span style="background-color: #F2F3F4;">${unselectedTextAfter}</span>`);
  }

  // Combine formatted text into a single string
  const finalText = formattedText.join('');
	console.log(finalText)
  // Display the final result with formatted text
  outputTextElement.innerHTML = finalText;
}



// Function to copy the output text to the clipboard
function copyToClipboard() {
    const outputTextElement = document.getElementById('outputText');
    const outputText = outputTextElement.textContent;

    const textarea = document.createElement('textarea');
    textarea.value = outputText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    //alert('Text copied to clipboard!');
}

function exportSettings() {
  const exportedConfig = transformers.map(transformer => {
    return {
      transformerClass: transformer.constructor.name,
      settings: transformer.settings.map(setting => {
        return {
          name: setting.name,
          value: setting.value
        };
      })
    };
  });

  const exportedText = JSON.stringify(exportedConfig);
  document.getElementById('importExportTextarea').value = exportedText;
}

// Function to import a transformer pipeline configuration
function importSettings() {
  const inputText = document.getElementById('importExportTextarea').value;
  if (!inputText) return; // No input

  try {
    const importedConfig = JSON.parse(inputText);
    if (!Array.isArray(importedConfig)) throw new Error('Invalid configuration format');

    // Clear existing transformers
    transformers.length = 0;

    // Create transformers based on the imported configuration
    importedConfig.forEach(config => {
      const transformerClass = transformerClasses.find(tc => tc.name === config.transformerClass);
      if (!transformerClass) throw new Error(`Transformer class not found: ${config.transformerClass}`);

      const transformer = new transformerClass();
      transformer.settings.forEach(setting => {
        const importedSetting = config.settings.find(s => s.name === setting.name);
        if (importedSetting) {
          setting.value = importedSetting.value;
        }
      });

      transformers.push(transformer);
    });

    // Update UI with imported transformers
    updateTransformerButtonsAndSettings();
  } catch (error) {
    console.error('Error importing configuration:', error.message);
    alert('Error importing configuration. Please check the format and try again.');
  }
}



addTransformerButtons();

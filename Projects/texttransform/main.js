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


function addToSubstringArray(inputText, substringArray, start, end, isSelected) {
  const substring = inputText.substring(start, end);
  substringArray.push({ substring, isSelected });
}
function buildSubstringArray(inputText, selectedRanges) {
  const substringArray = [];

  // Sort selectedRanges by start values in ascending order
  selectedRanges.sort((a, b) => a.start - b.start);

  let prevEnd = 0;

  for (const { start, end } of selectedRanges) {
    // Add the non-selected part before the current range
    if (start > prevEnd) {
      addToSubstringArray(inputText, substringArray, prevEnd, start, false);
    }

    // Add the selected part
    addToSubstringArray(inputText, substringArray, start, end, true);

    // Update the previous end position
    prevEnd = end;
  }

  // Add the remaining non-selected part after the last range
  if (prevEnd < inputText.length) {
    addToSubstringArray(inputText, substringArray, prevEnd, inputText.length, false);
  }

  return substringArray;
}
function modifySubstringArray(substringArray, findText, replaceText, caseSensitivity) {
	console.log(substringArray);
  for (const entry of substringArray) {
    if (entry.isSelected) {
      // Perform the replacement based on user settings
      const matchRegExp = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitivity ? 'g' : 'gi');
      entry.substring = entry.substring.replace(matchRegExp, replaceText);
    }
  }
}

function extractSelections(substringArray) {
  let extractedText = "";
  let extractedRanges = [];

  for (const entry of substringArray) {
    extractedText += entry.substring ;

    if (entry.isSelected) {
      const start = extractedText.length - entry.substring.length;
      const end = extractedText.length;
      extractedRanges.push({ start, end });
    }
  }

  return { modifiedText: extractedText, extractedRanges };
}


class ReplaceTransformer extends Transformer {
  static displayName = 'Replace';

  constructor() {
    super();
    this.settings.push(new Setting('Find Text', 'string', 'cat'));
    this.settings.push(new Setting('Replace Text', 'string', 'dog'));
    this.settings.push(new Setting('Case Sensitivity', 'select', 'Case Insensitive', ['Case Sensitive', 'Case Insensitive']));
  }

 modifySubstringArray_replace(substringArray, findText, replaceText, caseSensitivity) {
  for (let i = 0; i < substringArray.length; i++) {
    const entry = substringArray[i];

    if (entry.isSelected) {
      // Find all matches in the substring
      const matchRegExp = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), caseSensitivity ? 'g' : 'gi');
      let match;
      let lastIndex = 0;

      while ((match = matchRegExp.exec(entry.substring)) !== null) {
        // Add the non-matching text before the match
        if (lastIndex < match.index) {
          const nonMatchingSubstring = entry.substring.slice(lastIndex, match.index);
          substringArray.splice(i, 0, { substring: nonMatchingSubstring, isSelected: false });
          i++;
        }

        // Add the matching text
        const matchingSubstring = match[0];
        substringArray.splice(i, 0, { substring: matchingSubstring, isSelected: true });
        i++;

        lastIndex = match.index + matchingSubstring.length;
      }

      // Add the remaining non-matching text after the last match
      if (lastIndex < entry.substring.length) {
        const nonMatchingSubstring = entry.substring.slice(lastIndex);
        substringArray.splice(i, 0, { substring: nonMatchingSubstring, isSelected: false });
        i++;
      }

      // Remove the original substring object
      substringArray.splice(i, 1);
      i--;
    }
  }
}

  transform(input, selectedRanges) {
    let findText = this.settings.find(s => s.name === 'Find Text').value;
    let replaceText = this.settings.find(s => s.name === 'Replace Text').value;
    const caseSensitivity = this.settings.find(s => s.name === 'Case Sensitivity').value === 'Case Sensitive';

    // Replace "\n" with newline character
    findText = findText.replace(/\\n/g, '\n');
    replaceText = replaceText.replace(/\\n/g, '\n');
    // Replace "\t" with tab character
    findText = findText.replace(/\\t/g, '\t');
    replaceText = replaceText.replace(/\\t/g, '\t');

    // Create the data structure
    let substringArray = buildSubstringArray(input, selectedRanges);

    // Modify the data structure based on replacement settings
    this.modifySubstringArray_replace(substringArray, findText, replaceText, caseSensitivity);

    // Overwrite the string in objects with isSelected=true with the replace string
    for (const entry of substringArray) {
      if (entry.isSelected) {
        entry.substring = replaceText;
      }
    }

    // Call the extractSelections function
    const extractionResult = extractSelections(substringArray);

    return { text: extractionResult.modifiedText, selectedRanges: extractionResult.extractedRanges };
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
    //console.log(`Test Result for ${this.constructor.displayName}:`, transformedText.text);
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
    let charactersToSelect = this.settings.find(s => s.name === 'Characters to Select').value;
    const caseSensitivity = this.settings.find(s => s.name === 'Case Sensitivity').value;
    const invertSelection = this.settings.find(s => s.name === 'Invert Selection').value;

    // Replace "\n" with newline character
    charactersToSelect = charactersToSelect.replace(/\\n/g, '\n');
    // Replace "\t" with tab character
    charactersToSelect = charactersToSelect.replace(/\\t/g, '\t');

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


class DeleteTextTransformer extends Transformer {
  static displayName = 'Delete Text';

  constructor() {
    super();
    this.settings.push(new Setting('Replacement Text', 'string', ''));
  }

  transform(input, selectedRanges) {
    if (!Array.isArray(selectedRanges) || selectedRanges.length === 0) {
      // No selected text, nothing to delete
      return { text: input, selectedRanges: [] };
    }

    // Sort selected ranges to simplify deletion
    selectedRanges.sort((a, b) => a.start - b.start);

    const replacementText = this.settings.find(s => s.name === 'Replacement Text').value;
    const processedReplacement = this.processReplacement(replacementText);
    let result = '';
    let newSelectionRange = { start: -1, end: -1 };

    // Delete text before the first selected range
    result += input.substring(0, selectedRanges[0].start);

    // Replace deleted text with replacement text
    result += processedReplacement;
    newSelectionRange.start = selectedRanges[0].start;
    newSelectionRange.end = newSelectionRange.start + processedReplacement.length;

    // Delete text between consecutive selected ranges
    for (let i = 0; i < selectedRanges.length - 1; i++) {
      result += input.substring(selectedRanges[i].end, selectedRanges[i + 1].start);
    }

    // Delete text after the last selected range
    result += input.substring(selectedRanges[selectedRanges.length - 1].end);

    return { text: result, selectedRanges: [newSelectionRange] };
  }

  processReplacement(replacement) {
    // Replace \n with newline and \t with tab
    return replacement.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
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
    //console.log('Selected Ranges (Before Conversion):', selectedRanges);

    const growStartBy = parseInt(this.settings.find(s => s.name === 'Grow Start By').value, 10);
    const growEndBy = parseInt(this.settings.find(s => s.name === 'Grow End By').value, 10);
    //console.log('Grow Start By:', growStartBy);
    //console.log('Grow End By:', growEndBy);

    const newSelectedRanges = [];

    for (let i = 0; i < selectedRanges.length; i++) {
      const range = selectedRanges[i];
      const newRange = {
        start: Math.max(range.start - growStartBy, 0),
        end: Math.min(range.end + growEndBy, input.length),
      };
      newSelectedRanges.push(newRange);
    }

    //console.log('Selected Ranges (After Conversion):', newSelectedRanges);

    return {
      text: input,
      selectedRanges: newSelectedRanges,
    };
  }
}

class SelectAllTransformer extends Transformer {
  static displayName = 'Select All';

  transform(input, selectedRanges) {
    // Select the entire input text
    const newSelectedRanges = [{ start: 0, end: input.length }];

    return { text: input, selectedRanges: newSelectedRanges };
  }
}


class InsertAtIndexTransformer extends Transformer {
  static displayName = 'Insert at Index';

  constructor() {
    super();
    this.settings.push(new Setting('Insert Text', 'string', 'inserted'));
    this.settings.push(new Setting('Insert Index', 'number', 0));
    this.settings.push(new Setting('Insert Position', 'select', 'From Left', ['From Left', 'From Right']));
  }

  modifySubstringArray_insert(substringArray, insertText, insertIndex, insertPosition) {
    for (const entry of substringArray) {
      if (entry.isSelected) {
        // Perform the insertion based on user settings
        const position = insertPosition === 'From Left' ? insertIndex : entry.substring.length - insertIndex;
        entry.substring = entry.substring.slice(0, position) + insertText + entry.substring.slice(position);
      }
    }
  }

  transform(input, selectedRanges) {
    const insertText = this.settings.find(s => s.name === 'Insert Text').value;
    const insertIndex = this.settings.find(s => s.name === 'Insert Index').value;
    const insertPosition = this.settings.find(s => s.name === 'Insert Position').value;

    // Create the data structure
    const substringArray = buildSubstringArray(input, selectedRanges);

    // Modify the data structure based on insertion settings
    this.modifySubstringArray_insert(substringArray, insertText, insertIndex, insertPosition);

    // Call the extractSelections function
    const extractionResult = extractSelections(substringArray);

    return { text: extractionResult.modifiedText, selectedRanges: extractionResult.extractedRanges };
  }
}


class Base64Transformer extends Transformer {
  static displayName = 'Base64';

  constructor() {
    super();
    this.settings.push(new Setting('Operation', 'select', 'Encode', ['Encode', 'Decode']));
  }

  modifySubstringArray_base64(substringArray, operation) {
    for (let i = 0; i < substringArray.length; i++) {
      const entry = substringArray[i];

      if (entry.isSelected) {
        const selectedText = entry.substring;
        let convertedText;

        // Apply base64 encoding or decoding based on the operation
        if (operation === 'Encode') {
          convertedText = btoa(selectedText);
        } else {
          convertedText = atob(selectedText);
        }

        // Calculate the length difference
        const lengthDifference = convertedText.length - selectedText.length;

        // Replace the substring with the converted text
        entry.substring = convertedText;

        // Adjust the length of the entry's substring
        entry.end += lengthDifference;

        // Adjust subsequent selected ranges
        for (let j = i + 1; j < substringArray.length; j++) {
          substringArray[j].start += lengthDifference;
          substringArray[j].end += lengthDifference;
        }
      }
    }
  }

  transform(input, selectedRanges) {
    const operation = this.settings.find(s => s.name === 'Operation').value;

    // Create the data structure
    let substringArray = buildSubstringArray(input, selectedRanges);

    // Modify the data structure based on the base64 operation
    this.modifySubstringArray_base64(substringArray, operation);

    // Call the extractSelections function
    const extractionResult = extractSelections(substringArray);

    return { text: extractionResult.modifiedText, selectedRanges: extractionResult.extractedRanges };
  }
}



const transformerClasses = [ReplaceTransformer, DuplicateTransformer,ReverseTransformer,EscapeUrlTransformer,UnescapeUrlTransformer,CaseConverterTransformer,SelectTextTransformer , SelectBetweenDelimitersTransformer,InvertSelectionTransformer,DeleteTextTransformer, DeselectIfTransformer,SortLinesTransformer, GrowSelectionTransformer, SelectCharacterTransformer,SelectAllTransformer,InsertAtIndexTransformer,Base64Transformer];







function addTransformerButtons() {
  const addTransformerButtonsContainer = document.getElementById('addTransformerButtonsContainer');
  addTransformerButtonsContainer.innerHTML = '';

  transformerClasses.forEach(transformerClass => {
    const button = document.createElement('button');
    button.textContent = `${transformerClass.displayName}`;
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



function transformText() {
  const inputText = document.getElementById('inputText').value;
  const errorMessageTextarea = document.getElementById('errorMessage');
  errorMessageTextarea.textContent   = ''; // Clear previous errors
  
  // Apply transformations
  let result = inputText;
  let selectedRanges = [{ start: 0, end: inputText.length }]; // Initially, consider the entire text as selected
let counter = 0;
  transformers.forEach(transformer => {
    transformer.applySettings(); // Update settings before transforming
	counter +=1;
    
try {
    const transformedResult = transformer.transform(result, selectedRanges);
    result = transformedResult.text;
    selectedRanges = transformedResult.selectedRanges || selectedRanges;
	} catch (error) {
      errorMessageTextarea.textContent   += `Error in transformer ${counter} (${transformer.constructor.displayName}): ${error.message}\n`;
	//alert(`Error in ${transformer.constructor.displayName}: ${error.message}\n`);   
   }
	
	
  });

  // Check selectedRanges integrity
  if (!Array.isArray(selectedRanges)) {
    console.warn('Warning: selectedRanges is not an array.');
	alert('Warning: selectedRanges is not an array.');
    return;
  }

  // Sort selectedRanges based on the start value
  selectedRanges.sort((a, b) => a.start - b.start);

  // Check for overlapping ranges
  for (let i = 0; i < selectedRanges.length - 1; i++) {
    const currentRange = selectedRanges[i];
    const nextRange = selectedRanges[i + 1];

    if (currentRange.end > nextRange.start) {
      console.warn('Warning: Overlapping ranges detected.');
	  alert('Warning: Overlapping ranges detected.');
      return;
    }
  }

  // Check that start and end are integers and within bounds
  selectedRanges.forEach(range => {
	  sErr = "";
	  if (!Number.isInteger(range.start) || !Number.isInteger(range.end)){
		  sErr += "Not int "
	  }
	  if (range.start < 0 || range.end > result.length+1){
		  sErr += "Outside string length "
	  }
	  if (range.start > range.end){
		  sErr += "end before start "
	  }
	  if (sErr.length > 0){
		  console.log(range);
		  console.log(selectedRanges);
		  console.warn('Warning: Invalid range detected.');
		  alert('Warning: ' + sErr);
	  }
	  
    //if (!Number.isInteger(range.start) || !Number.isInteger(range.end) ||
    //    range.start < 0 || range.end > result.length+1 || range.start >= range.end) {
			
      return;
    
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
    if (colorToggle) {
      formattedText.push(`<span style="background-color: yellow;">${selectedText}</span>`);
    } else {
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
  console.log(finalText);
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
  const exportedConfig = transformers.map(transformer => ({
    [transformer.constructor.name]: transformer.settings.reduce((acc, setting) => {
      acc[setting.name] = setting.value;
      return acc;
    }, {})
  }));

  const exportedText = JSON.stringify(exportedConfig);
  const base64Encoded = btoa(exportedText); // Encode to Base64
  document.getElementById('importExportTextarea').value = exportedText;

  const urlParams = new URLSearchParams(window.location.search);
  urlParams.set('config', base64Encoded);
  window.history.replaceState({}, document.title, `${window.location.pathname}?${urlParams}`);
}

function importSettings() {
  const inputText = document.getElementById('importExportTextarea').value;
  if (!inputText) return; // No input

  try {
    // const base64Decoded = atob(inputText); // Decode from Base64
    const importedConfig = JSON.parse(inputText);
    if (!Array.isArray(importedConfig)) throw new Error('Invalid configuration format');

    // Clear existing transformers
    transformers.length = 0;

    // Create transformers based on the imported configuration
    importedConfig.forEach(config => {
      const transformerClass = transformerClasses.find(tc => tc.name === Object.keys(config)[0]);
      if (!transformerClass) throw new Error(`Transformer class not found: ${Object.keys(config)[0]}`);

      const transformer = new transformerClass();
      transformer.settings.forEach(setting => {
        const importedSetting = config[transformerClass.name][setting.name];
        if (importedSetting !== undefined) {
          setting.value = importedSetting;
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

function LoadUrlSettings() {
  const urlParams = new URLSearchParams(window.location.search);
  const importedText = urlParams.get('config');
  if (!importedText) return; // No configuration in the URL

  // Decode Base64 before setting in textarea
  const decodedText = atob(importedText);
  document.getElementById('importExportTextarea').value = decodedText;

  importSettings();
}

addTransformerButtons();
LoadUrlSettings();

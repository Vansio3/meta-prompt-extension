// options.js
// === DOM Elements ===
const apiKeyInput = document.getElementById('apiKey');
const modelNameInput = document.getElementById('modelName');
const metaPromptTextarea = document.getElementById('metaPrompt');
const saveButton = document.getElementById('save'); // Saves active settings to chrome.storage
const resetMetaPromptButton = document.getElementById('resetMetaPrompt');
const statusDiv = document.getElementById('status');
// Preset Elements
const presetListSelect = document.getElementById('presetList');
const presetNameInput = document.getElementById('presetNameInput');
const savePresetBtn = document.getElementById('savePresetBtn');
const loadPresetBtn = document.getElementById('loadPresetBtn');
const deletePresetBtn = document.getElementById('deletePresetBtn');

// === Constants ===
const DEFAULT_MODEL_NAME = "gemini-2.0-flash"; // Current default model
const DEFAULT_META_PROMPT = `You are an expert AI prompt engineer tasked with refining user input into a professional-grade prompt.
Analyze the user's text below and rewrite it to be clear, detailed, specific, and optimally structured for an AI model (LLM, image generator, etc., infer based on context). Retain the core intent but enhance it significantly.

Constraint: Your response MUST contain ONLY the final, enhanced prompt text, suitable for direct use. Do NOT include any conversational filler, introductory sentences (e.g., "Okay, here is the enhanced prompt:", "Here's the refined prompt:"), explanations, justifications, reasoning, apologies, formatting instructions (like **Prompt:**), self-references, or any text other than the refined prompt itself.

User's Input Text:
"{{USER_INPUT}}"

Enhanced Prompt:`;
const PRESETS_STORAGE_KEY = 'metaPromptPresets'; // localStorage key

// === State ===
let statusTimeoutId = null;

// === Core Settings Functions (chrome.storage.sync) ===

function restoreOptions() {
  // Restore active settings (API Key, Model, Current MetaPrompt)
  chrome.storage.sync.get(['apiKey', 'modelName', 'metaPrompt'], (data) => {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving active settings:", chrome.runtime.lastError);
        displayStatus('Error loading settings.', 'error');
        // Set defaults if loading failed
        modelNameInput.value = DEFAULT_MODEL_NAME;
        metaPromptTextarea.value = DEFAULT_META_PROMPT;
        // Proceed to load presets even if active settings fail
        initializePresets();
        return;
    }
    apiKeyInput.value = data.apiKey || '';
    modelNameInput.value = data.modelName || DEFAULT_MODEL_NAME;
    metaPromptTextarea.value = data.metaPrompt || DEFAULT_META_PROMPT;
    console.log("Active settings restored or defaults applied.");
    // Load presets after restoring active settings
    initializePresets();
  });
}

function saveOptions() { // Saves ACTIVE settings used by the extension
    clearStatus();
    const apiKey = apiKeyInput.value.trim();
    const modelName = modelNameInput.value.trim() || DEFAULT_MODEL_NAME; // Fallback ensures model is never empty
    const metaPrompt = metaPromptTextarea.value.trim();

    // --- Active Settings Validations ---
    let isValid = true;
    let validationWarning = false;

    if (!apiKey) {
        displayStatus('Error: API Key cannot be empty.', 'error');
        apiKeyInput.focus(); isValid = false;
    } else if (!modelName) { // Should be covered by fallback, but check anyway
        displayStatus('Error: Model Name cannot be empty.', 'error');
        modelNameInput.focus(); isValid = false;
    } else if (!metaPrompt) {
        displayStatus('Error: Active Meta-Prompt template cannot be empty.', 'error');
        metaPromptTextarea.focus(); isValid = false;
    } else if (!metaPrompt.includes('{{USER_INPUT}}')) {
        displayStatus('Error: Active Meta-Prompt MUST include {{USER_INPUT}}.', 'error');
        metaPromptTextarea.focus(); isValid = false;
    } else if ((metaPrompt.match(/{{USER_INPUT}}/g) || []).length > 1) {
        // Show warning but allow save
        displayStatus('Warning: Placeholder {{USER_INPUT}} appears multiple times in active prompt. Using first instance.', 'warning', false); // Don't auto-clear
        validationWarning = true; // Mark that there was a warning
    }

    if (!isValid) return; // Stop if critical validation failed

    // --- Save ACTIVE settings to chrome.storage.sync ---
    chrome.storage.sync.set(
        { apiKey: apiKey, modelName: modelName, metaPrompt: metaPrompt },
        () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving active settings:", chrome.runtime.lastError);
                // Don't overwrite validation warning if it exists
                if (!validationWarning) {
                    displayStatus(`Error saving settings: ${chrome.runtime.lastError.message}`, 'error');
                }
            } else {
                console.log("Active settings saved successfully.");
                 // Don't overwrite validation warning if it exists
                if (!validationWarning) {
                    displayStatus('Active settings saved successfully!', 'success');
                } else {
                    // Append success to the warning message
                    statusDiv.textContent += ' Active Settings Saved!';
                    // Ensure the timeout is cleared and reset for the combined message
                    clearTimeout(statusTimeoutId);
                    statusTimeoutId = setTimeout(clearStatus, 6000); // Longer timeout for warning + save confirmation
                }
            }
        }
    );
}

function resetMetaPrompt() { // Resets the TEXTAREA content only
    metaPromptTextarea.value = DEFAULT_META_PROMPT;
    console.log("Meta-Prompt textarea reset to default.");
    // Provide feedback, making it clear these are not yet the active settings
    displayStatus('Current template reset to default. Click "Save Active Settings" to use it.', 'success');
    metaPromptTextarea.focus();
}

// === Preset Management Functions (localStorage) ===

function loadPresetsFromStorage() {
  try {
    const presetsJson = localStorage.getItem(PRESETS_STORAGE_KEY);
    if (presetsJson) {
      const parsed = JSON.parse(presetsJson);
      return (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) ? parsed : {}; // Ensure it's an object, not array/null
    }
  } catch (error) {
    console.error("Error parsing presets from localStorage:", error);
  }
  return {}; // Return empty object if no data or parsing failed
}

function savePresetsToStorage(presets) {
  try {
    // Ensure presets is an object before saving
    if (typeof presets !== 'object' || presets === null || Array.isArray(presets)) {
        throw new Error("Invalid data type for presets.");
    }
    localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(presets));
    console.log("Presets saved to localStorage.");
    return true;
  } catch (error) {
    console.error("Error saving presets to localStorage:", error);
    displayStatus(`Error saving presets: ${error.message}. Check browser console.`, 'error');
    return false;
  }
}

function populatePresetDropdown(presets) {
  // Clear existing options (index 1 onwards)
  while (presetListSelect.options.length > 1) {
    presetListSelect.remove(1);
  }

  // Get and sort preset names
  const presetNames = Object.keys(presets).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })); // Case-insensitive sort

  // Update placeholder text based on whether presets exist
  if (presetNames.length === 0) {
      presetListSelect.options[0].textContent = "-- No presets saved --";
      presetListSelect.disabled = true; // Disable dropdown if empty
  } else {
      presetListSelect.options[0].textContent = "-- Select a preset --";
      presetListSelect.disabled = false; // Enable dropdown
  }

  // Add sorted preset names to dropdown
  presetNames.forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    presetListSelect.appendChild(option);
  });

   // Reset selection to placeholder and update button states
   presetListSelect.selectedIndex = 0;
   updatePresetButtonStates();
}

function handleSavePreset() {
    clearStatus();
    const presetName = presetNameInput.value.trim();
    const presetContent = metaPromptTextarea.value.trim();

    // Preset Validations
    if (!presetName) {
        displayStatus("Please enter a name for the preset.", "error");
        presetNameInput.focus(); return;
    }
    if (presetName === "-- Select a preset --" || presetName === "-- No presets saved --") {
         displayStatus("Invalid preset name.", "error");
         presetNameInput.focus(); return;
    }
    if (!presetContent) {
        displayStatus("Cannot save an empty template as a preset.", "error");
        metaPromptTextarea.focus(); return;
    }

    const presets = loadPresetsFromStorage();
    let isOverwrite = presets.hasOwnProperty(presetName);

    // Confirm overwrite
    if (isOverwrite) {
        if (!confirm(`Preset "${presetName}" already exists. Overwrite it?`)) {
            return; // User cancelled
        }
    }

    presets[presetName] = presetContent; // Add or update the preset

    if (savePresetsToStorage(presets)) {
        populatePresetDropdown(presets); // Refresh the list
        presetNameInput.value = ''; // Clear input field
        displayStatus(`Preset "${presetName}" ${isOverwrite ? 'updated' : 'saved'} successfully.`, "success");
        // Select the newly saved/updated preset in the dropdown
        presetListSelect.value = presetName;
        updatePresetButtonStates(); // Update button states based on new selection
    }
    // Error display handled within savePresetsToStorage
}

function handleLoadPreset() {
    clearStatus();
    const selectedName = presetListSelect.value;

    if (!selectedName) {
        displayStatus("Please select a preset from the list to load.", "error"); return;
    }

    const presets = loadPresetsFromStorage();

    if (presets.hasOwnProperty(selectedName)) {
        metaPromptTextarea.value = presets[selectedName];
        // Friendly reminder that this doesn't save active settings yet
        displayStatus(`Preset "${selectedName}" loaded into template area. Click "Save Active Settings" to use it.`, "success");
        metaPromptTextarea.focus();
    } else {
        console.error(`Selected preset "${selectedName}" not found in storage.`);
        displayStatus(`Error: Preset "${selectedName}" not found. It might have been deleted.`, "error");
        // Refresh list in case it's out of sync
        populatePresetDropdown(loadPresetsFromStorage());
    }
}

function handleDeletePreset() {
    clearStatus();
    const selectedName = presetListSelect.value;

    if (!selectedName) {
        displayStatus("Please select a preset from the list to delete.", "error"); return;
    }

    if (confirm(`Are you sure you want to delete the preset "${selectedName}"? This cannot be undone.`)) {
        const presets = loadPresetsFromStorage();
        if (presets.hasOwnProperty(selectedName)) {
            delete presets[selectedName]; // Remove the preset
            if (savePresetsToStorage(presets)) {
                populatePresetDropdown(presets); // Refresh dropdown (will reset selection)
                displayStatus(`Preset "${selectedName}" deleted successfully.`, "success");
            }
             // Error display handled within savePresetsToStorage
        } else {
            console.error(`Selected preset "${selectedName}" not found in storage for deletion.`);
            displayStatus(`Error: Preset "${selectedName}" could not be deleted.`, "error");
            // Refresh list in case it's out of sync
            populatePresetDropdown(loadPresetsFromStorage());
        }
    }
}

function initializePresets() {
    const presets = loadPresetsFromStorage();
    populatePresetDropdown(presets);
     // Initial button state update handled within populatePresetDropdown
}

// --- UI Helper Functions ---

function disablePresetButtons(disabled) {
    loadPresetBtn.disabled = disabled;
    deletePresetBtn.disabled = disabled;
}

function updatePresetButtonStates() {
    // Disable Load/Delete if the placeholder "-- Select..." or "-- No presets..." is selected (value is empty string)
    const noPresetSelected = !presetListSelect.value;
    disablePresetButtons(noPresetSelected || presetListSelect.disabled); // Also disable if dropdown itself is disabled
}


// === Status Display Functions ===
function displayStatus(message, type = 'success', autoClear = true, duration = 4000) {
    clearTimeout(statusTimeoutId); statusTimeoutId = null;
    statusDiv.textContent = message;
    statusDiv.className = 'status'; // Reset classes
    requestAnimationFrame(() => { // Ensure class changes apply after reset
        statusDiv.classList.add(type);
        statusDiv.classList.add('visible');
    });
    if (autoClear) { statusTimeoutId = setTimeout(clearStatus, duration); }
}

function clearStatus() {
    clearTimeout(statusTimeoutId); statusTimeoutId = null;
    statusDiv.classList.remove('visible'); // Start fade out
    setTimeout(() => {
         if (!statusDiv.classList.contains('visible')) { // Check if still hidden before clearing
             statusDiv.textContent = ''; statusDiv.className = 'status';
         }
    }, 300); // Match CSS transition duration + buffer
}

// === Event Listeners ===
document.addEventListener('DOMContentLoaded', restoreOptions);

// Main Settings Buttons
saveButton.addEventListener('click', saveOptions);
resetMetaPromptButton.addEventListener('click', resetMetaPrompt);

// Preset Management Buttons
savePresetBtn.addEventListener('click', handleSavePreset);
loadPresetBtn.addEventListener('click', handleLoadPreset);
deletePresetBtn.addEventListener('click', handleDeletePreset);

// Update Load/Delete button state when dropdown selection changes
presetListSelect.addEventListener('change', updatePresetButtonStates);

// Input field behavior
presetNameInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') { event.preventDefault(); handleSavePreset(); }
});

// Clear status on input in relevant fields
[apiKeyInput, modelNameInput, metaPromptTextarea, presetNameInput].forEach(element => {
    element.addEventListener('input', () => {
        // Clear only error/warning messages to avoid clearing success messages too quickly
        if (statusDiv.classList.contains('error') || statusDiv.classList.contains('warning')) {
             clearStatus();
        }
    });
});
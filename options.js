// options.js
const apiKeyInput = document.getElementById('apiKey');
const modelNameInput = document.getElementById('modelName');
const metaPromptTextarea = document.getElementById('metaPrompt');
const saveButton = document.getElementById('save');
const resetMetaPromptButton = document.getElementById('resetMetaPrompt');
const statusDiv = document.getElementById('status');

// --- Default Values ---
// Consistent defaults also needed in background.js
const DEFAULT_MODEL_NAME = "gemini-2.0-flash"; // Default model
const DEFAULT_META_PROMPT = `You are an expert AI prompt engineer tasked with refining user input into a professional-grade prompt.
Analyze the user's text below and rewrite it to be clear, detailed, specific, and optimally structured for an AI model (LLM, image generator, etc., infer based on context). Retain the core intent but enhance it significantly.

Constraint: Your response MUST contain ONLY the final, enhanced prompt text, suitable for direct use. Do NOT include any conversational filler, introductory sentences (e.g., "Okay, here is the enhanced prompt:", "Here's the refined prompt:"), explanations, justifications, reasoning, apologies, formatting instructions (like **Prompt:**), self-references, or any text other than the refined prompt itself.

User's Input Text:
"{{USER_INPUT}}"

Enhanced Prompt:`; // IMPORTANT: {{USER_INPUT}} placeholder

// --- Restore saved options on load ---
function restoreOptions() {
  // Get all saved settings at once
  chrome.storage.sync.get(['apiKey', 'modelName', 'metaPrompt'], (data) => {
    if (chrome.runtime.lastError) {
        console.error("Error retrieving settings:", chrome.runtime.lastError);
        displayStatus('Error loading settings.', 'error');
        // Still try to set defaults if loading failed
        modelNameInput.value = DEFAULT_MODEL_NAME;
        metaPromptTextarea.value = DEFAULT_META_PROMPT;
        return;
    }

    // Set values from storage or use defaults if not found
    apiKeyInput.value = data.apiKey || '';
    modelNameInput.value = data.modelName || DEFAULT_MODEL_NAME;
    metaPromptTextarea.value = data.metaPrompt || DEFAULT_META_PROMPT;

    console.log("Settings restored from storage or defaults applied.");
  });
}

// --- Save options ---
function saveOptions() {
  const apiKey = apiKeyInput.value.trim();
  const modelName = modelNameInput.value.trim() || DEFAULT_MODEL_NAME; // Fallback to default if empty
  const metaPrompt = metaPromptTextarea.value.trim(); // Don't fallback metaPrompt, validate instead

  // --- Validations ---
  if (!apiKey) {
    displayStatus('Error: API Key cannot be empty.', 'error');
    apiKeyInput.focus(); // Focus the problematic field
    return;
  }
   if (!modelName) { // Should not happen due to fallback, but good practice
    displayStatus('Error: Model Name cannot be empty.', 'error');
    modelNameInput.focus();
    return;
  }
  if (!metaPrompt) {
    displayStatus('Error: Meta-Prompt template cannot be empty.', 'error');
    metaPromptTextarea.focus();
    return;
  }
  // Crucial validation: Check for the placeholder
  if (!metaPrompt.includes('{{USER_INPUT}}')) {
      displayStatus('Error: Meta-Prompt MUST contain the placeholder {{USER_INPUT}}.', 'error');
      metaPromptTextarea.focus();
      return;
  }
   // Optional: Check if placeholder appears more than once (could cause issues)
   if ((metaPrompt.match(/{{USER_INPUT}}/g) || []).length > 1) {
       displayStatus('Warning: Placeholder {{USER_INPUT}} appears more than once. Using first instance.', 'warning');
       // Allow saving but warn the user
   }

  // --- Save to storage ---
  chrome.storage.sync.set(
    {
      apiKey: apiKey,
      modelName: modelName,
      metaPrompt: metaPrompt
    },
    () => {
      if (chrome.runtime.lastError) {
          console.error("Error saving settings:", chrome.runtime.lastError);
          displayStatus(`Error saving settings: ${chrome.runtime.lastError.message}`, 'error');
      } else {
          console.log("Settings saved successfully.");
          // Use the type parameter in displayStatus for visual feedback
          displayStatus('Settings saved successfully!', 'success');
      }
    }
  );
}

// --- Reset Meta-Prompt to Default ---
function resetMetaPrompt() {
    metaPromptTextarea.value = DEFAULT_META_PROMPT;
    console.log("Meta-Prompt reset to default in textarea.");
    // Optionally provide feedback, though changing the text is usually enough
    // displayStatus('Meta-Prompt reset to default.', 'success');
}


// --- Display status messages ---
function displayStatus(message, type = 'success') { // Default to success type
    statusDiv.textContent = message;
    statusDiv.className = type; // Apply 'success', 'error', or 'warning' class

    // Clear status after a few seconds
    setTimeout(() => {
        statusDiv.textContent = '';
        statusDiv.className = '';
    }, 5000); // Increased duration slightly
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);
resetMetaPromptButton.addEventListener('click', resetMetaPrompt);

// Optional: Allow saving by pressing Enter in text input fields (not textarea)
[apiKeyInput, modelNameInput].forEach(input => {
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveOptions(); // Trigger save on Enter
        }
    });
});
// options.js
const apiKeyInput = document.getElementById('apiKey');
const modelNameInput = document.getElementById('modelName');
const metaPromptTextarea = document.getElementById('metaPrompt');
const saveButton = document.getElementById('save');
const resetMetaPromptButton = document.getElementById('resetMetaPrompt');
const statusDiv = document.getElementById('status');

// --- Default Values ---
const DEFAULT_MODEL_NAME = "gemini-2.0-flash"; // Default model
const DEFAULT_META_PROMPT = `You are an expert AI prompt engineer tasked with refining user input into a professional-grade prompt.
Analyze the user's text below and rewrite it to be clear, detailed, specific, and optimally structured for an AI model (LLM, image generator, etc., infer based on context). Retain the core intent but enhance it significantly.

Constraint: Your response MUST contain ONLY the final, enhanced prompt text, suitable for direct use. Do NOT include any conversational filler, introductory sentences (e.g., "Okay, here is the enhanced prompt:", "Here's the refined prompt:"), explanations, justifications, reasoning, apologies, formatting instructions (like **Prompt:**), self-references, or any text other than the refined prompt itself.

User's Input Text:
"{{USER_INPUT}}"

Enhanced Prompt:`;

// --- Variable to manage status timeout ---
let statusTimeoutId = null;

// --- Restore saved options on load ---
function restoreOptions() {
  chrome.storage.sync.get(['apiKey', 'modelName', 'metaPrompt'], (data) => {
    if (chrome.runtime.lastError) {
      console.error("Error retrieving settings:", chrome.runtime.lastError);
      displayStatus('Error loading settings.', 'error');
      // Set defaults if loading failed
      modelNameInput.value = DEFAULT_MODEL_NAME;
      metaPromptTextarea.value = DEFAULT_META_PROMPT;
      return;
    }
    apiKeyInput.value = data.apiKey || '';
    modelNameInput.value = data.modelName || DEFAULT_MODEL_NAME;
    metaPromptTextarea.value = data.metaPrompt || DEFAULT_META_PROMPT;
    console.log("Settings restored or defaults applied.");
  });
}

// --- Save options ---
function saveOptions() {
  // Clear any existing status messages immediately on save attempt
  clearStatus();

  const apiKey = apiKeyInput.value.trim();
  const modelName = modelNameInput.value.trim() || DEFAULT_MODEL_NAME;
  const metaPrompt = metaPromptTextarea.value.trim();

  // --- Validations ---
  if (!apiKey) {
    displayStatus('Error: API Key cannot be empty.', 'error');
    apiKeyInput.focus(); return;
  }
  if (!modelName) {
    displayStatus('Error: Model Name cannot be empty.', 'error');
    modelNameInput.focus(); return;
  }
  if (!metaPrompt) {
    displayStatus('Error: Meta-Prompt template cannot be empty.', 'error');
    metaPromptTextarea.focus(); return;
  }
  if (!metaPrompt.includes('{{USER_INPUT}}')) {
      displayStatus('Error: Meta-Prompt MUST include the placeholder {{USER_INPUT}}.', 'error');
      metaPromptTextarea.focus(); return;
  }
  if ((metaPrompt.match(/{{USER_INPUT}}/g) || []).length > 1) {
       // Show warning but still allow saving
       displayStatus('Warning: Placeholder {{USER_INPUT}} appears more than once. Using first instance.', 'warning', false); // Don't auto-clear warning immediately
       // Continue to save...
   }

  // --- Save to storage ---
  chrome.storage.sync.set(
    { apiKey: apiKey, modelName: modelName, metaPrompt: metaPrompt },
    () => {
      if (chrome.runtime.lastError) {
          console.error("Error saving settings:", chrome.runtime.lastError);
          // Use existing warning if present, otherwise show error
          if (!statusDiv.classList.contains('warning')) {
              displayStatus(`Error saving settings: ${chrome.runtime.lastError.message}`, 'error');
          }
      } else {
          console.log("Settings saved successfully.");
          // Use existing warning if present, otherwise show success
          if (!statusDiv.classList.contains('warning')) {
              displayStatus('Settings saved successfully!', 'success');
          } else {
              // Append success message to warning if needed, or just let warning stay
              statusDiv.textContent += ' Settings Saved!';
              // Re-set timeout for the combined/warning message
              clearTimeout(statusTimeoutId); // Clear previous timeout
              statusTimeoutId = setTimeout(clearStatus, 6000); // Longer timeout for warning+save
          }
      }
    }
  );
}

// --- Reset Meta-Prompt to Default ---
function resetMetaPrompt() {
    metaPromptTextarea.value = DEFAULT_META_PROMPT;
    console.log("Meta-Prompt reset to default in textarea.");
    // Optional: Indicate reset success visually
    displayStatus('Meta-Prompt template reset to default.', 'success');
    metaPromptTextarea.focus(); // Focus textarea after reset
}

// --- Display status messages with animation ---
function displayStatus(message, type = 'success', autoClear = true, duration = 4000) {
    // Clear previous timeout if a new message comes in
    clearTimeout(statusTimeoutId);
    statusTimeoutId = null; // Reset timeout ID

    statusDiv.textContent = message;
    // Reset classes first, then add the correct type and visible class
    statusDiv.className = 'status'; // Base class
    // Use requestAnimationFrame to ensure the class changes are applied after reset
    requestAnimationFrame(() => {
        statusDiv.classList.add(type);    // Add 'success', 'error', or 'warning'
        statusDiv.classList.add('visible'); // Trigger fade-in animation
    });

    // Set timeout to clear the message if autoClear is true
    if (autoClear) {
        statusTimeoutId = setTimeout(clearStatus, duration);
    }
}

// --- Clear status message with animation ---
function clearStatus() {
    clearTimeout(statusTimeoutId); // Prevent multiple timeouts
    statusTimeoutId = null;
    statusDiv.classList.remove('visible'); // Trigger fade-out animation

    // Optional: Clear text content after animation (match transition duration in CSS)
    // Set a timeout slightly longer than the CSS transition to clear text
    setTimeout(() => {
         if (!statusDiv.classList.contains('visible')) { // Only clear if still hidden
             statusDiv.textContent = '';
             statusDiv.className = 'status'; // Reset classes fully
         }
    }, 300); // Match CSS transition duration (0.25s = 250ms) + buffer
}


// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', restoreOptions);
saveButton.addEventListener('click', saveOptions);
resetMetaPromptButton.addEventListener('click', resetMetaPrompt);

// Optional: Allow saving by pressing Enter in text input fields
[apiKeyInput, modelNameInput].forEach(input => {
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            saveOptions();
        }
    });
});

// Add listener to clear status if user starts typing again
[apiKeyInput, modelNameInput, metaPromptTextarea].forEach(element => {
    element.addEventListener('input', () => {
        // Optionally clear only error/warning messages on input
        if (statusDiv.classList.contains('error') || statusDiv.classList.contains('warning')) {
             clearStatus();
        }
    });
});
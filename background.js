// background.js

// --- Default Values (Fallback if storage fails or not set) ---
const DEFAULT_MODEL_NAME = "gemini-2.0-flash";
const DEFAULT_META_PROMPT = `You are an expert AI prompt engineer tasked with refining user input into a professional-grade prompt.
Analyze the user's text below and rewrite it to be clear, detailed, specific, and optimally structured for an AI model (LLM, image generator, etc., infer based on context). Retain the core intent but enhance it significantly.

Constraint: Your response MUST contain ONLY the final, enhanced prompt text, suitable for direct use. Do NOT include any conversational filler, introductory sentences (e.g., "Okay, here is the enhanced prompt:", "Here's the refined prompt:"), explanations, justifications, reasoning, apologies, formatting instructions (like **Prompt:**), self-references, or any text other than the refined prompt itself.

User's Input Text:
"{{USER_INPUT}}"

Enhanced Prompt:`; // IMPORTANT: {{USER_INPUT}} placeholder

const CONTEXT_MENU_ID = "enhancePrompt";

// --- Context Menu Setup --- (No changes needed)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: "Enhance Prompt",
    contexts: ["selection"]
  });
  console.log("MetaPrompt context menu created or updated.");
});

// --- Listener for Context Menu Click --- (No changes needed)
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID && info.selectionText && tab) {
    console.log(`Context menu "${info.menuItemId}" clicked in tab ${tab.id}. Selected text:`, info.selectionText);
    enhanceText(info.selectionText, tab.id);
  } else if (!tab) {
      console.error("MetaPrompt: Could not get tab information for context menu click.");
  }
});

// --- Listener for Extension Icon Click --- (No changes needed)
chrome.action.onClicked.addListener((tab) => {
  chrome.runtime.openOptionsPage();
});

// --- Core Enhancement Function ---
async function enhanceText(selectedText, tabId) {
  console.log("MetaPrompt: enhanceText called for tab", tabId);
  try {
    // 1. Get ALL Settings from storage (API Key, Model, MetaPrompt)
    const data = await chrome.storage.sync.get(['apiKey', 'modelName', 'metaPrompt']);

    // --- Validate API Key ---
    const apiKey = data.apiKey;
    if (!apiKey) {
      console.error("API Key not found in storage. Please set it in the extension options.");
      notifyUser('MetaPrompt Error', 'Google AI API Key is not set. Click the MetaPrompt icon or go to Extension options to set it.');
      // Optionally open options: chrome.runtime.openOptionsPage();
      return; // Stop processing
    }

    // --- Determine Model and MetaPrompt to use (from storage or default) ---
    const currentModelName = data.modelName || DEFAULT_MODEL_NAME;
    let currentMetaPromptTemplate = data.metaPrompt || DEFAULT_META_PROMPT;

    // --- Validate MetaPrompt Template ---
    if (!currentMetaPromptTemplate.includes('{{USER_INPUT}}')) {
        console.error("MetaPrompt template from storage is missing the {{USER_INPUT}} placeholder. Falling back to default.");
        notifyUser('MetaPrompt Warning', 'Custom meta-prompt is missing the required {{USER_INPUT}} placeholder. Using the default prompt template instead.');
        currentMetaPromptTemplate = DEFAULT_META_PROMPT; // Use default if invalid
    }

    // --- Construct the final meta-prompt by replacing the placeholder ---
    // Use replace() only once, even if the placeholder exists multiple times (as warned in options)
    const finalMetaPrompt = currentMetaPromptTemplate.replace('{{USER_INPUT}}', selectedText);

    // --- Construct the API Endpoint URL ---
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${currentModelName}:generateContent?key=${apiKey}`;

    console.log(`Using Model: ${currentModelName}`);
    console.log(`Using API Endpoint: ${apiUrl.split('?key=')[0]}?key=...`); // Don't log key
    console.log(`Sending final meta-prompt to Gemini:\n`, finalMetaPrompt);

    // 3. Call the Google AI API (using dynamic URL and constructed prompt)
    const response = await fetch(apiUrl, { // Use dynamic apiUrl
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ "text": finalMetaPrompt }] // Use the final prompt with user text
        }],
        // Optional: Add safety settings, generation config if needed
      }),
    });

    console.log("API Response Status:", response.status, response.statusText);

    // --- Handle API Response (Error Checking) ---
    if (!response.ok) {
        let errorData = { error: { message: `HTTP error ${response.status}` } };
        try {
            errorData = await response.json();
            console.error("API Error Response Body:", errorData);
        } catch (e) {
            console.error("API Error: Could not parse JSON response body. Status:", response.statusText);
            errorData.error.message += ` - ${response.statusText} (Failed to parse error body)`;
        }
        const errorMessage = errorData?.error?.message || 'Unknown API error';

        // Check specifically for model not found errors related to the *configured* model
        if ((errorMessage.includes(`models/${currentModelName}`) || errorMessage.includes("Model not found") || errorMessage.includes("Invalid model name")) && (response.status === 404 || response.status === 400)) {
            const specificError = `Configured model '${currentModelName}' not found or invalid for your API key. Check the name in MetaPrompt Options or try a different one (e.g., '${DEFAULT_MODEL_NAME}'). (Error: ${response.status})`;
            console.error("Model Error:", specificError);
            notifyUser('MetaPrompt Model Error', specificError);
        } else {
            // General API error
            notifyUser('MetaPrompt API Error', `API request failed: ${response.status}. ${errorMessage}`);
        }
        throw new Error(`API request failed: ${response.status} ${errorMessage}`);
    }

    // --- Process Successful API Response ---
    const responseData = await response.json();
    // console.log("API Success Response Body:", JSON.stringify(responseData, null, 2)); // Verbose

    // 4. Extract the enhanced text (same logic as before)
    let enhancedText = '';
    let blockReason = responseData.promptFeedback?.blockReason;

    if (blockReason) {
        console.warn("Prompt blocked by API safety filters:", blockReason, responseData.promptFeedback);
        enhancedText = `[Enhancement blocked by API: ${blockReason}]`;
        notifyUser('MetaPrompt Warning', `Enhancement blocked by API safety filters: ${blockReason}. Original text not replaced.`);
        // return; // Optionally stop if blocked
    } else if (responseData.candidates && responseData.candidates.length > 0 && responseData.candidates[0].content?.parts?.length > 0) {
        enhancedText = responseData.candidates[0].content.parts[0].text.trim();
        const finishReason = responseData.candidates[0].finishReason;
        if (finishReason && finishReason !== "STOP" && finishReason !== "NULL") { // NULL can be normal for short outputs
             console.warn("Gemini response finishReason:", finishReason);
             if (finishReason === "MAX_TOKENS") {
                 notifyUser('MetaPrompt Warning', 'Enhanced prompt might be incomplete due to model output length limits.');
             } else if (finishReason !== "SAFETY") { // Don't double-notify safety
                 notifyUser('MetaPrompt Info', `Model stopped generating for reason: ${finishReason}.`);
             }
        }
    } else {
        console.warn("Could not extract enhanced text from API response:", responseData);
        const candidateError = responseData.candidates?.[0]?.error?.message;
        throw new Error(`Failed to parse enhanced text from API response.${candidateError ? ` (${candidateError})` : ''}`);
    }

    console.log("Final Enhanced text extracted:", enhancedText);

    // 5. Inject script to replace text in the active tab (same logic as before)
    if (enhancedText && tabId) {
      chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: replaceSelectedTextInPage, // Injected function below
        args: [enhancedText],
      }).catch(err => {
          console.error(`Failed to inject script into tab ${tabId}:`, err);
          notifyUser('MetaPrompt Error', `Could not access page to replace text. Try reloading page or check permissions. Error: ${err.message}`);
      });
    } else if (!tabId) {
        console.error("MetaPrompt: Cannot inject script, tabId is invalid.");
    }

  } catch (error) {
    console.error("Error in enhanceText function:", error);
    // Avoid double-notifying for known handled errors like missing API key
    if (error.message && !error.message.includes("API Key not found")) {
         notifyUser('MetaPrompt Error', `Failed to enhance text: ${error.message}. Check background console (Service Worker) for details.`);
    }
  }
}

// --- Helper Function for Notifications --- (No changes needed)
function notifyUser(title, message) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: title,
        message: message,
        priority: 1
    });
}


// --- Function to be Injected into the Web Page --- (No changes needed)
function replaceSelectedTextInPage(replacementText) {
  const activeElement = document.activeElement;
  let success = false;
  console.log("MetaPrompt Injection: Attempting to replace text. Active element:", activeElement?.tagName, "ContentEditable:", activeElement?.isContentEditable);
  try {
    // Strategy 1: Standard Input or Textarea
    if (activeElement && (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT')) {
      if (typeof activeElement.selectionStart === 'number' && typeof activeElement.selectionEnd === 'number' && !activeElement.readOnly && !activeElement.disabled) {
        const start = activeElement.selectionStart;
        const end = activeElement.selectionEnd;
        const originalValue = activeElement.value;
        activeElement.value = originalValue.substring(0, start) + replacementText + originalValue.substring(end);
        const newCursorPos = start + replacementText.length;
        activeElement.focus();
        activeElement.setSelectionRange(newCursorPos, newCursorPos);
        activeElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        activeElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
        activeElement.blur(); activeElement.focus(); // Force framework update
        activeElement.setSelectionRange(newCursorPos, newCursorPos);
        console.log("MetaPrompt Injection: Text replaced in active <" + activeElement.tagName + ">.");
        success = true;
      } else { console.warn("MetaPrompt Injection: Input selection invalid/disabled/readonly:", activeElement); }
    }
    // Strategy 2: ContentEditable Element
    if (!success && activeElement && activeElement.isContentEditable) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && activeElement.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(replacementText);
        range.insertNode(textNode);
        range.setStartAfter(textNode); range.setEndAfter(textNode);
        selection.removeAllRanges(); selection.addRange(range);
        activeElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
        console.log("MetaPrompt Injection: Text replaced in active contenteditable element.");
        success = true;
      } else { console.warn("MetaPrompt Injection: Selection not found within active contenteditable element."); }
    }
  } catch (e) { console.error("MetaPrompt Injection: Error during direct text replacement:", e); success = false; }
  // Strategy 3: Fallback to Clipboard
  if (!success) {
    console.warn("MetaPrompt Injection: Could not directly replace text. Attempting copy to clipboard.");
    navigator.clipboard.writeText(replacementText)
      .then(() => {
        console.log("MetaPrompt Injection: Enhanced text copied to clipboard.");
        alert('MetaPrompt: Could not directly replace text. Enhanced prompt copied to clipboard!');
      })
      .catch(err => {
        console.error('MetaPrompt Injection: Failed to copy text to clipboard:', err);
        alert('MetaPrompt: Could not replace text AND failed to copy to clipboard. See browser console (F12) for details.');
      });
  }
}
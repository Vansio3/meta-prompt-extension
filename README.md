# MetaPrompt Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Enhance selected text into professionally engineered AI prompts directly in your browser using the Google Gemini API.**

MetaPrompt allows you to quickly transform your rough ideas or simple instructions into detailed, effective prompts suitable for large language models (LLMs) or other AI systems. Simply select text on a webpage, right-click, and choose "Enhance Prompt".

---

## Features

*   **Context Menu Integration:** Adds an "Enhance Prompt" option to the right-click menu when text is selected.
*   **AI-Powered Enhancement:** Sends your selected text, guided by a customizable "meta-prompt", to the Google AI Gemini API for rewriting.
*   **In-Place Replacement:** Automatically replaces the selected text within `<input>`, `<textarea>`, and most `contenteditable` elements with the AI-generated enhanced prompt.
*   **Clipboard Fallback:** If direct replacement isn't possible (e.g., selected text in a non-editable paragraph), the enhanced prompt is automatically copied to your clipboard with a notification.
*   **Configurable:**
    *   Requires your personal Google AI API Key.
    *   Set your preferred Gemini model (defaults to `gemini-2.0-flash`).
    *   Customize the "meta-prompt" template that instructs the AI on *how* to enhance your text.
*   **Manifest V3 Compliant:** Built using the latest Chrome extension standards.

## How it Works

1.  You select some text on a webpage (e.g., inside a ChatGPT input box, a forum post editor, etc.).
2.  You right-click on the selection and choose "Enhance Prompt".
3.  The extension retrieves your configured API key, Gemini model name, and meta-prompt template from its settings.
4.  It inserts your selected text into the meta-prompt template (replacing the `{{USER_INPUT}}` placeholder).
5.  This complete instruction (the meta-prompt + your text) is sent to the specified Google AI Gemini model via its API.
6.  The AI model processes the request and returns the enhanced prompt text.
7.  The extension attempts to replace the originally selected text on the page with the enhanced version.
8.  If replacement fails, it copies the enhanced text to the clipboard and alerts you.

## Requirements

*   Google Chrome Browser
*   A valid Google AI API Key. You can obtain one for free from [Google AI Studio](https://aistudio.google.com/app/apikey).

## Installation (for Local Development/Testing)

Since this extension is not yet on the Chrome Web Store, you need to load it manually:

1.  **Clone or Download:**
    *   Clone this repository: `git clone https://github.com/Vansio3/meta-prompt-extension.git`
    *   OR Download the ZIP file from GitHub and extract it.
2.  **Open Chrome Extensions:** Open Google Chrome, navigate to `chrome://extensions/`.
3.  **Enable Developer Mode:** Ensure the "Developer mode" toggle (usually in the top-right corner) is switched ON.
4.  **Load Unpacked:** Click the "Load unpacked" button.
5.  **Select Folder:** Navigate to the directory where you cloned or extracted the extension files (the folder containing `manifest.json`) and select it.
6.  The "MetaPrompt" extension should now appear in your list of extensions.

## Configuration

Before using the extension, you **must** configure your API key:

1.  **Open Options:**
    *   Click the MetaPrompt extension icon in your Chrome toolbar.
    *   OR, go to `chrome://extensions/`, find MetaPrompt, and click "Details", then "Extension options".
2.  **Enter API Key:** Paste your Google AI API Key into the designated field.
3.  **Configure Model (Optional):**
    *   The default model is `gemini-2.0-flash`.
    *   You can change this to another Gemini model available to your API key (e.g., `gemini-2.5-flash-preview-04-17`, `gemini-2.5-pro-preview-03-25`). Ensure the model name is correct.
4.  **Customize Meta-Prompt (Optional):**
    *   You can edit the template used to instruct the AI.
    *   **Crucially, your custom template MUST include the placeholder `{{USER_INPUT}}` exactly once.** This is where your selected text will be inserted.
    *   You can reset to the recommended default using the "Reset to Default Meta-Prompt" button.
5.  **Save:** Click the "Save All Settings" button.

## Usage

1.  Go to any webpage with an input field, textarea, or editable content area.
2.  Type a basic idea or instruction (e.g., `picture of a red cat on a blue roof`).
3.  Select the text you just typed.
4.  Right-click on the selected text.
5.  Choose "Enhance Prompt" from the context menu.
6.  Wait a moment for the API call to complete.
7.  The selected text should be replaced by the AI-enhanced version. If not, you should receive an alert indicating it was copied to your clipboard.

## Important Notes & Caveats

*   **API Key Security:** Your API key is stored using `chrome.storage.sync`. While reasonably secure for this purpose, be mindful of its sensitivity. **Never commit your API key directly into the code or share it.**
*   **Model Availability:** The default model (`gemini-2.0-flash`) or any custom model you enter must be accessible via the Generative Language API with your specific API key and in your region. If you get "Model not found" errors, try a different model name like `gemini-2.5-flash-preview-04-17`.
*   **Rich Text Editors:** Compatibility with complex WYSIWYG / Rich Text Editors varies. The extension tries to handle standard inputs, textareas, and `contenteditable` elements, but some editors might interfere. The clipboard fallback helps in these cases.
*   **Meta-Prompt Placeholder:** The `{{USER_INPUT}}` placeholder in the meta-prompt template is mandatory for the extension to function correctly.
*   **API Costs:** While Google AI currently has generous free tiers, be aware of potential costs associated with API usage if you exceed free limits.

## Troubleshooting

*   **Doesn't Work / Error Notification:**
    *   Ensure you have saved a valid API key in the options.
    *   Check the configured Model Name is correct and available for your key.
    *   Check the Meta-Prompt template contains `{{USER_INPUT}}`.
    *   Open the background console: Go to `chrome://extensions/`, find MetaPrompt, click the "Service worker" link, and check for errors in the console tab.
    *   Open the console on the webpage where you tried to use it (Press F12 or Ctrl+Shift+J / Cmd+Opt+J) and look for errors prefixed with `MetaPrompt Injection:`.
*   **Text Not Replaced:** The clipboard fallback should activate with an alert. This usually means the focused element wasn't a standard input/textarea or contenteditable, or the site prevents programmatic changes.

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (assuming you add an MIT license file).

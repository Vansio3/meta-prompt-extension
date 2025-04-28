# MetaPrompt Chrome Extension

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**A Chrome extension to enhance selected text into structured AI prompts using the Google AI API.**

MetaPrompt helps users refine draft prompts or basic text into more detailed and structured prompts suitable for large language models (LLMs), such as Google's Gemini series. It integrates with the browser's context menu to process selected text via the Google AI API.

## Overview

Effective prompts often require more detail and structure than initial ideas provide. MetaPrompt assists with this by:

1.  Allowing users to select text within editable areas on a webpage (input fields, textareas, contenteditable elements).
2.  Providing a context menu option ("Enhance Prompt").
3.  Sending the selected text, along with a user-defined instruction template (the "meta-prompt"), to a specified Google AI Gemini model.
4.  Replacing the original selection with the AI-generated enhanced prompt, or copying it to the clipboard if direct replacement fails.

## Features

*   **Context Menu Integration:** Enhance prompts via the right-click menu without leaving the current page.
*   **Google AI API Usage:** Utilizes the Google Generative AI API.
*   **Configurable Model:** Select the desired Gemini model through the options page (default: `gemini-2.0-flash`).
*   **Customizable Meta-Prompt:** Define the instructions sent to the AI for processing selected text using the `{{USER_INPUT}}` placeholder.
*   **Preset Management:** Save, load, and delete multiple meta-prompt templates using browser `localStorage`.
*   **Text Replacement:** Attempts to replace text directly in standard `<input>`, `<textarea>`, and most `<div contenteditable="true">` elements.
*   **Clipboard Fallback:** Copies the enhanced prompt to the clipboard if direct replacement is not possible.
*   **API Key Storage:** Uses `chrome.storage.sync` to store the user's Google AI API key.
*   **Dark Theme Options Page:** Provides an options page with a dark theme for configuration.

## How it Works

1.  **Select Text:** Highlight text within an editable field on a webpage.
2.  **Right-Click:** Open the context menu.
3.  **Select Option:** Click "Enhance Prompt".
4.  **Process & Replace/Copy:** The extension sends a request to the Google AI API. The selected text is then replaced with the response, or the response is copied to the clipboard.

## Installation

**Option 1: From Chrome Web Store (Link TBD)**

> A link will be added here upon publication to the Chrome Web Store.

**Option 2: From Source**

1.  Clone or download the source code from this repository:
    ```bash
    git clone https://github.com/Vansio3/meta-prompt-extension.git
    ```
    (If downloaded as ZIP, extract the files).
2.  Open Google Chrome and navigate to `chrome://extensions/`.
3.  Enable "Developer mode" (top-right toggle).
4.  Click "Load unpacked".
5.  Select the directory containing the extension's files (the folder with `manifest.json`).
6.  MetaPrompt should appear in the extensions list.

## Configuration

Before first use, configure the extension:

1.  **Open Options:** Click the MetaPrompt icon in the Chrome toolbar, or go to `chrome://extensions/`, find MetaPrompt, click "Details" -> "Extension options".
2.  **Enter API Key:** Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey) if you don't have one. Paste it into the "Google AI API Key" field.
3.  **Set Model Name (Optional):** Change the default model (`gemini-2.0-flash`) if needed. Ensure the chosen model is compatible with your API key.
4.  **Customize Meta-Prompt (Optional):** Modify the default "Meta-Prompt Template". This template instructs the AI. Ensure it contains the `{{USER_INPUT}}` placeholder exactly once.
5.  **Save Settings:** Click "Save Active Settings". The extension will use these settings (API Key, Model, Active Meta-Prompt) for enhancement requests.

## Usage

1.  Navigate to a webpage with an editable text area.
2.  Type your initial text (e.g., "describe a cat").
3.  Select the text.
4.  Right-click the selection.
5.  Choose "Enhance Prompt".
6.  The selected text should be replaced by the AI-generated prompt. If replacement fails, an alert will notify you that the text has been copied to the clipboard.

## Preset Management

The options page allows managing meta-prompt templates:

*   **Save Preset:** Modify the "Active Meta-Prompt Template" textarea, provide a name in the "Save Current Template As Preset" field, and click "Save Preset". Saves the template to `localStorage`.
*   **Load Preset:** Select a saved preset from the dropdown and click "Load". This populates the "Active Meta-Prompt Template" textarea. **Note:** You must click "Save Active Settings" afterwards to make the loaded template active for the extension.
*   **Delete Preset:** Select a preset from the dropdown, click "Delete", and confirm. Removes the preset from `localStorage`.
*   **Reset Template:** Click "Reset Current Template to Default" to revert the textarea content to the default template.

## Technology Stack

*   JavaScript (ES6+)
*   HTML5
*   CSS3
*   Chrome Extension APIs (Manifest V3: `contextMenus`, `storage`, `scripting`, `notifications`, `clipboardWrite`)
*   Google Generative AI API
*   Browser `localStorage`

## Development

1.  Clone the repository.
2.  Load the extension into Chrome using "Load unpacked" as described in Installation.
3.  Make code changes.
4.  Reload the extension via the refresh icon on the `chrome://extensions/` page.
5.  Use the browser's developer tools (Service Worker console, page console) for debugging.

## Contributing

Contributions, bug reports, and feature suggestions are welcome. Please check the [issues page](https://github.com/Vansio3/meta-prompt-extension/issues). Submit pull requests against the `main` branch.

## License

This project is licensed under the MIT License. See the LICENSE file (if available) or refer to the [MIT license text](https://opensource.org/licenses/MIT).

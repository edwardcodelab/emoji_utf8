Emoji Substitution Plugin for DokuWiki (UTF-8 Fork)
This is a fork of the original Emoji plugin by Patrick Brown. The core functionality remains the same—allowing emoji characters or shortcut names to be inserted into wiki pages—but this version shifts from PNG image rendering to native UTF-8 emoji characters for a lighter, more modern experience. Shortnames are converted to Unicode on-the-fly during editing and rendered as UTF-8 text in previews and final pages.
Key Features

* Real-Time Editing Conversion: Type :smile: followed by space, period, or Enter—it auto-replaces with 😄 directly in the textarea.

* Autocomplete Dropdown: Start typing :smi for suggestions showing live emojis (e.g., 😄 :smile:). Select to insert the UTF-8 emoji.

* Input Methods:

  * Copy-paste Unicode characters (e.g., 😄).

  * Type shortnames (e.g., :smile:).

  * Type emoticons (e.g., :-)).

* Rendering: Outputs native UTF-8 emojis in previews, final pages, and exports (no PNG images or dependencies).

* Syntax Safety: Shortnames and emoticons need spaces around them to avoid conflicts (e.g., C:D won't trigger :D).

* Emoji List: Shortnames from EmojiOne strategy (e.g., :grinning:, :thumbsup:).

Installation

1. Download and extract to lib/plugins/emoji_utf8/.

2. Clear cache via Admin > Configuration Settings > Cache.

3. No additional assets needed (PNG support disabled).

Usage
To insert a smiling face:

* Copy the Unicode: 😄

* Type :smile: (auto-converts during edit)

* Type :-) (converts to 😄)

Example wiki text: Hello :smile: world! Renders as: Hello 😄 world!
For full shortname list, see emoji.codes.
Changes from Original

* UTF-8 Focus: No PNG images—uses browser-native rendering for better performance and accessibility.

* Editing Enhancements: jQuery Textcomplete for autocomplete with emoji previews; keyup handler for instant replacement.

* Cleanup: Removed test files, CSS for images, and Emojione image classes (keeps ruleset for mapping).

* with emoji font support (e.g., add font-family: 'Apple Color Emoji', sans-serif;
/**
 * Autocomplete script for Emoji plugin
 *
 * @license     GPL 2[](http://www.gnu.org/licenses/gpl.html)
 * @author      Patrick Brown <ptbrown@whoopdedo.org>, forked
 */
/* DOKUWIKI:include_once script/jquery.textcomplete.js */

+function(){
'use strict';

var byLengthCompare = function(a,b) { 
    // Updated for objects: compare by shortname.length
    return a.shortname.length > b.shortname.length; 
};
var sortByLength = function(a) {
    return a.sort(byLengthCompare);
};

jQuery(function(){

    var $editForm = jQuery('#wiki__text');
    if($editForm.length) {
        if (typeof emoji_strategy === 'undefined') return;

        var langFooter = '<a href="https://www.emojicopy.com" target="_blank">&nbsp;' +
                          LANG.plugins.emoji_utf8.browseall +
                          '<span class="arrow">&#10697;</span></a>';

        // Build mapping: full shortname (with colons, e.g., ":grinning:") -> UTF-8 emoji char
        var emojiMap = {};
        for (var key in emoji_strategy) {
            var data = emoji_strategy[key];
            emojiMap[data.shortname] = String.fromCodePoint(parseInt(data.unicode, 16));
        }

        $editForm.textcomplete([{
            match: /(^|\s):([\-+]?[\-+\w]+)$/,
            index: 2,
            /* TODO disable where emoji is not allowed (code blocks, headings, etc)
            context: function(text) {
            },
            */
            search: function(term, addTerm) {
                var names = [], aliases = [], keywords = [];
                jQuery.each(emoji_strategy, function(shortname, data) {
                    var fullShortname = data.shortname; // e.g., ":grinning:"
                    var emoji = emojiMap[fullShortname];
                    if(shortname.indexOf(term) > -1) {
                        names.push({shortname: shortname, fullShortname: fullShortname, emoji: emoji});
                    } else if((data.aliases !== null) && (data.aliases.indexOf(term) > -1)) {
                        aliases.push({shortname: shortname, fullShortname: fullShortname, emoji: emoji});
                    } else if((data.keywords !== null) && (data.keywords.indexOf(term) > -1)) {
                        keywords.push({shortname: shortname, fullShortname: fullShortname, emoji: emoji});
                    }
                });

                if(term.length >= 3) {
                    sortByLength(names);
                    sortByLength(aliases);
                    // Alphabetical sort for keywords by shortname
                    keywords.sort(function(a, b) {
                        return a.shortname.localeCompare(b.shortname);
                    });
                }
                addTerm(names.concat(aliases).concat(keywords));
            },
            template: function(obj) {
                // Use UTF-8 emoji in dropdown
                return obj.emoji + ' :' + obj.shortname + ':';
            },
            replace: function(obj) {
                // Insert UTF-8 emoji + space, not shortname
                return '$1' + obj.emoji + ' ';
            },
            cache: true
        }], { footer: langFooter });

        // Real-time auto-replacement on space/period/enter
        function replaceAtCursor(text, start, end, replacement) {
            return text.substring(0, start) + replacement + text.substring(end);
        }

        $editForm.on('keyup', function(e) {
            if (e.keyCode !== 32 && e.keyCode !== 190 && e.keyCode !== 13) return; // space, ., enter

            var $this = jQuery(this);
            var text = $this.val();
            var pos = this.selectionStart;
            var before = text.substring(0, pos);

            // Find last potential shortname before cursor and replace if complete
            // Updated regex to match the textcomplete pattern: :([\-+]?[\-+\w]+):
            var lastColon = before.lastIndexOf(':');
            if (lastColon !== -1 && lastColon > 0) {
                var potential = before.substring(lastColon - 1); // Include preceding space/start
                var match = potential.match(/(^|\s):([\-+]?[\-+\w]+):$/);
                if (match) {
                    var shortnameWord = match[2]; // e.g., "smile" or "sweat_smile"
                    var fullShortname = ':' + shortnameWord + ':';
                    var emoji = emojiMap[fullShortname];
                    if (emoji) {
                        // Replace and adjust position
                        var replaceStart = lastColon;
                        var replaceEnd = pos;
                        var newText = replaceAtCursor(text, replaceStart, replaceEnd, emoji);
                        $this.val(newText);
                        var newPos = replaceStart + emoji.length;
                        this.setSelectionRange(newPos, newPos);
                    }
                }
            }
        });

    }

});
}();
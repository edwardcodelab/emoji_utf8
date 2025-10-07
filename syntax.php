<?php
/**
 * Emoji UTF-8 Substitution Plugin for DokuWiki
 *
 * @license     GPL 2 http://www.gnu.org/licenses/gpl-2.0.html
 * @author      Patrick Brown <ptbrown@whoopdedo.org> (original), Dodotori (UTF-8 fork)
 */

// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();

class syntax_plugin_emoji_utf8 extends DokuWiki_Syntax_Plugin {

    /**
     * Match emoji code points: (kept as-is for direct Unicode input)
     */
    public $unicodeRegexp = '(?:[*#0-9](?>\\xEF\\xB8\\x8F)?\\xE2\\x83\\xA3(?!\\xEF\\xB8\\x8E)|[*#0-9]\\xEF\\xB8\\x8F|\\xC2[\\xA9\\xAE]\\xEF\\xB8\\x8F|\\xE2..(?>\\xF0\\x9F\\x8F[\\xBB-\\xBF])?\\xEF\\xB8\\x8F|\\xE2[\\x8C-\\x90\\x98-\\x9E\\xAC-\\xAF].(?>\\xF0\\x9F\\x8F[\\xBB-\\xBF])?(?!\\xEF\\xB8\\x8E)|\\xE3(?>\\x80[\\xB0\\xBD]|\\x8A[\\x97\\x99])\\xEF\\xB8\\x8F|\\xF0\\x9F(?>\\x87.\\xF0\\x9F\\x87.|..(?>\\xEF\\xB8\\x8F)?)(?!\\xEF\\xB8\\x8E))';

    // Static smileys (raw keys like ':-)' => hex)
    protected $smileys = array(
        '8-O' => '1F62F',
        '8-o' => '1F62F',
        ':-\\' => '1F615',
        ':-?' => '1F616',
        ':-|' => '1F601',
        '^_^' => '1F604',
        ':?:' => '2753',
        ':!:' => '26A0',
    );

    // Runtime properties
    protected $shortcode_replace = array();  // Full shortname (e.g., ':smile:') => hex Unicode
    protected $shortnameRegexp;
    protected $smileyRegexp;

    public function __construct() {
        // Load emoji_strategy.json for shortname mapping
        $strategy_path = dirname(__FILE__) . '/assets/emoji_strategy.json';
        if (file_exists($strategy_path)) {
            $strategy = json_decode(file_get_contents($strategy_path), true);
            if ($strategy !== null) {
                foreach ($strategy as $key => $data) {
                    $full_shortname = $data['shortname'];  // e.g., ':smile:'
                    $this->shortcode_replace[$full_shortname] = $data['unicode'];  // e.g., '1f604'
                }
            }
        }

        // Build regex for shortnames (full :name:)
        $short_keys = array_keys($this->shortcode_replace);
        $this->shortnameRegexp = '(?:' . implode('|', array_map('preg_quote_cb', $short_keys)) . ')';

        // Build regex for smileys (raw like ':-)')
        $smiley_keys = array_keys($this->smileys);
        $this->smileyRegexp = '(?:' . implode('|', array_map('preg_quote_cb', $smiley_keys)) . ')';
    }

    public function getType() {
        return 'substitution';
    }

    public function getSort() {
        return 229;
    }

    public function connectTo($mode) {
        $this->Lexer->addSpecialPattern($this->getUnicodeRegexp(), $mode, 'plugin_emoji_utf8');
        $this->Lexer->addSpecialPattern('(?<=\W|^)'.$this->getShortnameRegexp().'(?=\W|$)', $mode, 'plugin_emoji_utf8');
        $this->Lexer->addSpecialPattern('(?<=\W|^)'.$this->getSmileyRegexp().'(?=\W|$)', $mode, 'plugin_emoji_utf8');
    }

    public function handle($match, $state, $pos, Doku_Handler $handler) {
        /* Clean up variant selector */
        $match = str_replace("\xEF\xB8\x8F", "", $match);
        $unicode = $this->toUnicode($match);
        return array($match, $unicode);
    }

    public function render($mode, Doku_Renderer $renderer, $data) {
        list($match, $unicode) = $data;
        switch ($mode) {
            case 'xhtml':
                // Output UTF-8 emoji (no PNG)
                $renderer->doc .= $unicode;
                break;
            case 'odt':
                // Output UTF-8 for ODT (no image)
                $renderer->doc .= $unicode;
                break;
            default:
                // Adds text variant selector for other modes
                $renderer->cdata($unicode . "\xEF\xB8\x8E");
                break;
        }
        return true;
    }

    private function getUnicodeRegexp() {
        return $this->unicodeRegexp;
    }

    private function getShortnameRegexp() {
        return $this->shortnameRegexp;
    }

    private function getSmileyRegexp() {
        return $this->smileyRegexp;
    }

    private function toUnicode($shortname) {
        // Check shortcode map (full :name:)
        if (isset($this->shortcode_replace[$shortname])) {
            $unicode_hex = $this->shortcode_replace[$shortname];
        }
        // Check smileys (raw like ':-)')
        elseif (isset($this->smileys[$shortname])) {
            $unicode_hex = $this->smileys[$shortname];
        } else {
            return $shortname;  // Fallback for direct Unicode
        }

        // Convert hex (may be multi-codepoint like '1f1e8-1f1f3') to UTF-8
        if (strpos($unicode_hex, '-') !== false) {
            $pairs = explode('-', $unicode_hex);
        } else {
            $pairs = array($unicode_hex);
        }
        $codes = array_map('hexdec', $pairs);
        return unicode_to_utf8($codes);
    }

}
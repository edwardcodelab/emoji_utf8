<?php
/**
 * @license     GPL 2[](http://www.gnu.org/licenses/gpl.html)
 * @author      Patrick Brown <ptbrown@whoopdedo.org>
 */
// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();

class action_plugin_emojiutf8 extends DokuWiki_Action_Plugin {

    public function register(Doku_Event_Handler $controller) {
        $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'tplMetaheaderOutput');
    }

    public function tplMetaheaderOutput(Doku_Event &$event, $param) {
        $assetsrc = DOKU_BASE.'lib/plugins/emojiutf8/';
        switch($this->getConf('assetsrc')) {
            case 'cdn':
                $assetsrc = '//cdn.jsdelivr.net/emojione/';
                break;
            case 'external':
                $asseturi = $this->getConf('asseturi');
                if($asseturi)
                    $assetsrc = $asseturi;
                break;
        }
        /* Insert JS variable for CDN server using native json_encode. */
        $event->data['script'][] = array(
            'type'  => 'text/javascript',
            '_data' => 'var emoji_assetsrc = ' . json_encode($assetsrc) . ';'
        );

        // Expose emoji_strategy.json as JS var only on edit/create pages (for autocomplete/replacement)
        global $ACT;
        if (in_array($ACT, ['edit', 'create'])) {
            $strategy_path = DOKU_PLUGIN . 'emojiutf8/assets/emoji_strategy.json';
            
            if (!file_exists($strategy_path)) {
    error_log("Emoji plugin: Strategy file not found at: " . $strategy_path); // Logs to error.log
} else {
    error_log("Emoji plugin: Strategy file loaded successfully.");
}

            if (file_exists($strategy_path)) {
                $strategy = json_decode(file_get_contents($strategy_path), true); // Native json_decode
                if ($strategy !== null) { // Safety check for valid JSON
                    $event->data['script'][] = array(
                        'type'  => 'text/javascript',
                        '_data' => 'var emoji_strategy = ' . json_encode($strategy) . ';'
                    );
                }
            }
        }
    }
}
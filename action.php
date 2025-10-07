<?php
/**
 * @license     GPL 2[](http://www.gnu.org/licenses/gpl.html)
 * @author      Patrick Brown <ptbrown@whoopdedo.org> (original), Dodotori (UTF-8 fork)
 */
// must be run within Dokuwiki
if(!defined('DOKU_INC')) die();

class action_plugin_emoji_utf8 extends DokuWiki_Action_Plugin {

    public function register(Doku_Event_Handler $controller) {
        $controller->register_hook('TPL_METAHEADER_OUTPUT', 'BEFORE', $this, 'tplMetaheaderOutput');
    }

    public function tplMetaheaderOutput(Doku_Event &$event, $param) {
        // Expose emoji_strategy.json as JS var only on edit/create pages (for autocomplete/replacement)
        global $ACT;
        if (in_array($ACT, ['edit', 'create'])) {
            $strategy_path = DOKU_PLUGIN . 'emoji_utf8/assets/emoji_strategy.json';
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
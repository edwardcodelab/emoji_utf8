(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['jquery'], factory);
  } else if (typeof exports === 'object') {
    // Node/CommonJS
    module.exports = factory(require('jquery'));
  } else {
    // Browser globals
    factory(jQuery);
  }
}(function ($) {
  'use strict';

  var $document = $(document);
  var now = Date.now || function () { return new Date().getTime(); };

  var id = 1;

  function Strategy(options) {
    $.extend(this, options);
    if (this.cache == null) { this.cache = (this.search || this.replace) ? {} : null; }
    this.id = id++;
    this.index = this.makeIndex();
  }

  $.extend(Strategy.prototype, {
    maxCount: 100,

    debounce: false,

    makeIndex: function () {
      return {};
    },

    lookup: function (query, callback) {
      if (this.debounce) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout($.proxy(this, 'actualLookup', query, callback), this.debounce);
      } else {
        this.actualLookup(query, callback);
      }
    },

    actualLookup: function (query, callback) {
      var that = this;
      var ret = this.findMatches(query, function (matches) {
        that.sortMatches(matches, query, callback);
      });
      if (ret) { this.sortMatches(ret, query, callback); }
    },

    sortMatches: function (matches, query, callback) {
      var results = matches.slice(0, this.maxCount);
      callback(results);
    },

    findMatches: function (query, callback) {
      var cacheKey;
      if (this.cache) {
        cacheKey = this.cacheKey(query);
        if (this.cache[cacheKey]) { return this.cache[cacheKey]; }
      }
      var matches = this.search(query, callback);
      if (matches && this.cache) { this.cache[cacheKey] = matches; }
      return matches;
    },

    cacheKey: function (query) {
      return query;
    }
  });

  Strategy.parse = function (strategies, option) {
    return $.map(strategies, function (strategy) {
      var s = new Strategy(strategy);
      if (option) {
        s.maxCount = option.maxCount;
        s.debounce = option.debounce;
      }
      return s;
    });
  };

  /**
   * Dropdown UI Component
   */
  function Dropdown($el, option) {
    this.$el = $el;
    this.option = option;
    this.shown = false;
    this.selectedIndex = null;
    this.rendered = [];
  }

  $.fn.textcomplete.Dropdown = Dropdown;

  $.extend(Dropdown.prototype, {
    // public methods
    // --------------

    deactivate: function () {
      this.$el.html('');
      this.data = [];
      this.shown = false;
      this.selectedIndex = null;
    },

    activate: function () {
      this.shown = true;
      this.$el.show();
    },

    render: function (data) {
      this.data = data;
      this.$el.hide().html('');
      this.rendered = [];
      var html = [];
      for (var i = 0; i < data.length; i++) {
        html.push(this.option.template(data[i]));
      }
      this.$el.append(html.join(''));
      this.rendered = this.$el.find(this.option.selector);
      if (this.option.autoShow && data.length) { this.activate(); }
    },

    hide: function () {
      this.deactivate();
    },

    clear: function () {
      this.$el.html('');
      this.data = [];
      this.deactivate();
    },

    up: function (e) {
      e.preventDefault();
      this.move(-1);
    },

    down: function (e) {
      e.preventDefault();
      this.move(1);
    },

    select: function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (this.shown && this.selectedIndex != null) { this.trigger(); }
    },

    trigger: function () {
      var $item = this.getActiveItem();
      if (!$item.length) { return; }
      this.option.onSelect(this.getValueFromItem($item));
      this.hide();
    },

    move: function (position) {
      if (!this.shown) { return; }
      this.selectedIndex = (this.selectedIndex != null) ? this.selectedIndex + position : 0;
      if (this.selectedIndex < 0) { this.selectedIndex = this.data.length - 1; }
      else if (this.selectedIndex >= this.data.length) { this.selectedIndex = 0; }
      this.rendered.removeClass('textcomplete-item-active');
      var $item = this.getActiveItem();
      $item.addClass('textcomplete-item-active');
      this.option.onHover(this.getValueFromItem($item));
      var itemTop = $item.position().top;
      var itemHeight = $item.outerHeight();
      var listTop = this.$el.scrollTop();
      var listHeight = this.$el.outerHeight();
      if (itemTop < 0) {
        this.$el.scrollTop(listTop + itemTop);
      } else if (itemTop + itemHeight > listHeight) {
        this.$el.scrollTop(listTop + itemTop + itemHeight - listHeight);
      }
    },

    getActiveItem: function () {
      return $(this.rendered[this.selectedIndex]);
    },

    getValueFromItem: function ($item) {
      return this.data[$item.index()];
    }
  });

  Dropdown.DEFAULTS = {
    autoShow: true,
    onSelect: function () {},
    onHover: function () {}
  };

  /**
   * Adapter
   */
  function Adapter (el, option) {
    this.el = el;
    this.option = option;
    this.completer = this.option.completer;
    this.dropdown = this.completer.dropdown;
  }

  $.extend(Adapter.prototype, {
    // public methods
    // --------------

    trigger: function (text) {
      var matchInfo = this.getMatchInfo(text);
      if (matchInfo) {
        this.completer.lookup(matchInfo);
      } else {
        this.dropdown.clear();
      }
    },

    select: function (value) {
      this.el.focus();
      var text = this.replaceText(value);
      this.el.trigger('input').trigger('change');
      this.completer.trigger(text);
    },

    // private methods
    // ---------------

    getMatchInfo: function (text) {
      return null; // Adapter must implement this
    },

    replaceText: function (value) {
      return ''; // Adapter must implement this
    }
  });

  /**
   * Abstract adapter
   */
  function AbstractAdapter () {
    Adapter.apply(this, arguments);
  }

  AbstractAdapter.prototype = new Adapter();
  AbstractAdapter.prototype.constructor = AbstractAdapter;

  /**
   * Textarea adapter
   */
  function Textarea (el, completer, option) {
    this.el = $(el);
    this.option = option;
    this.completer = completer;
    this.dropdown = completer.dropdown;
  }

  Textarea.prototype = new AbstractAdapter();
  Textarea.prototype.constructor = Textarea;

  $.extend(Textarea.prototype, {
    // private methods
    // ---------------

    getMatchInfo: function (text) {
      var cursorPos = this.el[0].selectionEnd;
      text = text || this.el.val();
      for (var i = 0; i < this.completer.strategies.length; i++) {
        var strategy = this.completer.strategies[i];
        var context = strategy.context ? strategy.context(text) : true;
        if (!context) { continue; }
        var match = strategy.match.exec(text);
        if (match && match.index <= cursorPos && cursorPos <= match.index + match[0].length) {
          return { strategy: strategy, match: match };
        }
      }
      return null;
    },

    replaceText: function (value) {
      var pre = this.el.val().substring(0, this.completer.matchInfo.match.index);
      var post = this.el.val().substring(this.completer.matchInfo.match.index + this.completer.matchInfo.match[0].length);
      var replace = this.completer.strategy.replace(this.completer.matchInfo.match, value);
      if ($.isArray(replace)) { replace = replace[0]; }
      var text = pre + replace + post;
      this.el.val(text);
      this.el[0].selectionStart = this.el[0].selectionEnd = pre.length + replace.length;
      return text;
    }
  });

  /**
   * Dropdown via event delegation (jquery.events)
   */
  function EventDelegationDropdown () {
    Dropdown.apply(this, arguments);
    this.$parent = this.option.appendTo;
    this.$parent.on('click.textcomplete', this.option.selector, $.proxy(this.onClick, this));
  }

  EventDelegationDropdown.prototype = new Dropdown();
  EventDelegationDropdown.prototype.constructor = EventDelegationDropdown;

  $.extend(EventDelegationDropdown.prototype, {
    // public methods
    // --------------

    show: function () {
      this.shown = true;
      this.$parent.append(this.$el);
      this.$el.show();
    },

    hide: function () {
      this.deactivate();
      this.$el.remove();
    },

    onClick: function (e) {
      var $target = $(e.target);
      var index = $target.index();
      this.selectedIndex = index;
      this.trigger();
    }
  });

  /**
   * Global completer
   */
  var completerId = 1;

  function Completer (el, option) {
    this.el = el;
    this.option = option;
    this.id = completerId++;
    this.strategies = [];
    this.dropdown = this.initializeDropdown();
    this.adapter = this.initializeAdapter();
  }

  $.fn.textcomplete.Completer = Completer;

  $.extend(Completer.prototype, {
    // Public properties
    // -----------------

    DEFAULTS: {
      adapter: Textarea,
      dropdown: Dropdown,
      zIndex: '100'
    },

    // Public methods
    // --------------

    registerStrategy: function (strategy) {
      this.strategies.push(strategy);
    },

    // Private methods
    // ---------------

    initializeAdapter: function () {
      var Adapter = this.option.adapter;
      return new Adapter(this.el[0], this, this.option);
    },

    initializeDropdown: function () {
      var Dropdown = this.option.dropdown;
      var $el = $('<ul/>').addClass('dropdown-menu textcomplete-dropdown').attr('id', 'textcomplete-dropdown-' + this.id);
      if (this.option.dropdownClass) { $el.addClass(this.option.dropdownClass); }
      $el.css('z-index', this.option.zIndex || this.DEFAULTS.zIndex);
      return new Dropdown($el, $.extend({ completer: this }, this.DEFAULTS.dropdown, this.option));
    },

    trigger: function (text) {
      this.adapter.trigger(text);
    },

    lookup: function (matchInfo) {
      this.matchInfo = matchInfo;
      matchInfo.strategy.lookup(matchInfo.match[matchInfo.strategy.index], $.proxy(this.dropdown.render, this.dropdown));
    },

    select: function (value) {
      this.adapter.select(value);
    }
  });

  // jQuery plugin definition
  $.fn.textcomplete = function (strategies, option) {
    var completer = new Completer(this, option || {});
    completer.strategies = Strategy.parse(strategies, completer.option);
    this.on({
      'input.textcomplete': function (e) {
        completer.trigger($(this).val());
      },
      'keydown.textcomplete': function (e) {
        var command = completer.dropdown.option.onKeydown(e, completer.dropdown.commands);
        if (command) {
          completer.dropdown[command](e);
        }
      }
    });
    return this;
  };

  // Global completer instance counter

  // Commands for Dropdown
  Dropdown.commands = {
    SKIP_DEFAULT: 0,
    KEY_UP: 1,
    KEY_DOWN: 2,
    KEY_ENTER: 3,
    KEY_PAGEUP: 4,
    KEY_PAGEDOWN: 5,
    KEY_ESCAPE: 6
  };

  // jQuery plugin
}));
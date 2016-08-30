
;(function ($, window, document, undefined) {
	var pluginName = "editable",
		defaults = {
			keyboard: true,
			dblclick: true,
			button: true,
			buttonSelector: ".edit",
			buttonCancelSelector: '.inline-action-cancel',
			maintainWidth: true,
			dropdowns: {},
			defaultClass: '',
			edit: function() {},
			save: function() {},
			validator: (values) => { return true; },
			cancel: function() {}
		};

	function editable(element, options) {
		this.element = element;
		this.options = $.extend({}, defaults, options) ;

		this._defaults = defaults;
		this._name = pluginName;

		this.init();
	}

	editable.prototype = {
		init: function() {
			this.editing = false;

			if (this.options.dblclick) {
				$(this.element)
					.css('cursor', 'pointer')
					.bind('dblclick', this.toggle.bind(this));
			}

			if (this.options.button) {
				$(this.options.buttonSelector, this.element)
					.bind('click', this.toggle.bind(this));
				$(this.options.buttonCancelSelector, this.element)
					.bind('click', this.cancel.bind(this));
			}
			this._saveBlock = false;
			$(this.options.buttonCancelSelector).hide();
		},

		toggle: function(e) {
			e.preventDefault();

			if (! this._saveBlock) this.editing = !this.editing;

			if (this.editing) {
				if (! this._saveBlock) this.edit();
			} else {
				this.save();
			}
		},

		edit: function() {
			var instance = this,
				values = {};
			let self = this;

			$(this.element).find(this.options.buttonCancelSelector).show();
			$('td[data-field]', this.element).each(function() {
				var input,
					field = $(this).data('field'),
					value = $(this).text(),
					width = $(this).width();

				values[field] = value;

				$(this).empty();

				if (instance.options.maintainWidth) {
					$(this).width(width);
				}

				if (field in instance.options.dropdowns) {
					input = $('<select></select>');

					for (var i = 0; i < instance.options.dropdowns[field].length; i++) {
						$('<option></option>')
							 .text(instance.options.dropdowns[field][i])
							 .appendTo(input);
					};

					input.val(value)
						 .data('old-value', value)
						 .dblclick(instance._captureEvent);
					if (self.options.defaultClass) $(input).addClass(self.options.defaultClass);
					if ($(this).data('field-class')) $(input).addClass($(this).data('field-class'));
				} else if ($(this).data('field-type') === 'select') {
					input = $('<select></select>');
					let values = $(this).data('field-select');
					if (Array.isArray(values)) {
						let newValues = {};
						values.forEach((x, i, ar) => { newValues[i] = x; });
						values = newValues;
					};
					for (let i in values) {
						$(`<option value=${i}>${values[i]}</option>`)
							.appendTo(input);
						input.val($(this).data('field-selected'));
					}

					input.data('old-value', value)
						 .dblclick(instance._captureEvent);
					if (self.options.defaultClass) $(input).addClass(self.options.defaultClass);
					if ($(this).data('field-class')) $(input).addClass($(this).data('field-class'));
				} else if ($(this).data('field-type') === 'textarea') {
					input = $('<textarea></textarea>')
						.val(value)
						.data('old-value', value)
						.dblclick(instance._captureEvent);
					if (self.options.defaultClass) $(input).addClass(self.options.defaultClass);
					if ($(this).data('field-class')) $(input).addClass($(this).data('field-class'));
				} else {
					input = $('<input type="text" />')
						.val(value)
						.data('old-value', value)
						.dblclick(instance._captureEvent);
					if (self.options.defaultClass) $(input).addClass(self.options.defaultClass);
					if ($(this).data('field-class')) $(input).addClass($(this).data('field-class'));
				}

				input.appendTo(this);

				if (instance.options.keyboard) {
					input.keydown(instance._captureKey.bind(instance));
				}
			});

			this.options.edit.bind(this.element)(values);
		},

		save: function() {
			let self = this;
			this._saveBlock = true;
			var instance = this,
				values = {};

			$('td[data-field]', this.element).each(function() {
				if ($(this).data('field-type') === 'select') {
					values[$(this).data('field')] = $(this).data('field-select')[$(':input', this).val()];
					$(this).data('field-selected', $(':input', this).val());
				} else values[$(this).data('field')] = $(':input', this).val();
			});

			if (this.options.validator(values)) {
				$('td[data-field]', this.element).each(function() {
					$(this).empty().text(values[$(this).data('field')]);
				});
				$(this.element).find(this.options.buttonCancelSelector).hide();
				this._saveBlock = false;
				this.options.save.bind(this.element)(values);
			};
		},

		cancel: function() {
			
			let self = this;
			var instance = this,
				values = {};

			$('td[data-field]', this.element).each(function() {
				var value = $(':input', this).data('old-value');

				values[$(this).data('field')] = value;

				$(this).empty()
					   .text(value);
			});

			this.editing = false;
			$(this.element).find(this.options.buttonCancelSelector).hide();
			this._saveBlock = false;
			this.options.cancel.bind(this.element)(values);
		},

		_captureEvent: function(e) {
			e.stopPropagation();
		},

		_captureKey: function(e) {
			let self = this;
			if (e.which === 13) {
				this.editing = false;
				this.save();
			} else if (e.which === 27) {
				this.editing = false;
				$(this.element).find(this.options.buttonCancelSelector).hide();
				this.cancel();
			}
		}
	};

	$.fn[pluginName] = function(options) {
		return this.each(function () {
			if (!$.data(this, "plugin_" + pluginName)) {
				$.data(this, "plugin_" + pluginName,
				new editable(this, options));
			}
		});
	};

})(jQuery, window, document);
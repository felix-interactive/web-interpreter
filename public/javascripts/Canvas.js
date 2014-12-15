/***
review process
***/

//TODO: hide/show container guidelines option, disable/enable inline shadows

function Canvas(){
	this.drag_start_position;
}

Canvas.prototype.render = function (data){
	var $body = $(this.ie6 ? document.body : document);
	var canvas = $('<div>').addClass('entire').css({height: $body.height(), width: $body.width()});
	canvas.empty();
	this.drawElement(canvas, data.ui["0"], data);
	return canvas;
};

Canvas.prototype.drawElement = function(parent, data, entire_data){
	var data = i_data.resolveElementData(data);

	var element;

	element = this.drawElementType(element, parent, data);
	element = this.drawElementStyles(element, parent, data);
	//element = this.drawElementBindings(element, parent, data);

	element.attr('element-id', data.id);

	if (parent.hasClass('entire')){
		parent.append(element);
	} else {
		parent.find('.layout_cell').first().append(element);
	}

	var line_break = i_variables.getVariableValue(data.attributes, ['line_break']);
	var floated = i_variables.getVariableValue(data.attributes, ['floated']);
	if (line_break == 'true' && floated == 'false'){
		if (parent.hasClass('entire')){
			parent.append('<br />');
		} else {
			parent.find('.layout_cell').first().append('<br />');
		}
	}

	setTimeout(function(){
		element = i_canvas.drawElementPosition(element, parent, data);
	}, 1);

	for (var i=0; i<data.children.length; i++){
		this.drawElement(element, entire_data.ui[data.children[i]], entire_data);
	}
};

Canvas.prototype.drawElementType = function(element, parent, data){
	if (data.type == 'layout'){
		element = $('.template_canvas_layout').clone(true,true);


		//scroll
		var overflow_x = i_variables.getVariableValue(data.attributes, ['overflow_x']);
		var overflow_y = i_variables.getVariableValue(data.attributes, ['overflow_y']);
		//TODO: save scroll pos between redraws
		if (overflow_y == 'scroll' || overflow_x == 'scroll'){
			element.bind("mousewheel",function(event) {
				event.preventDefault();
				event.stopPropagation();

				var container = $(this);

				if (event.shiftKey){
					if (overflow_x == 'scroll'){
						var scroll_left = container.scrollLeft();
						if(event.originalEvent.wheelDelta /120 > 0){
							//scrolling right !
							scroll_left = scroll_left - 15;
						}
						else {
							//scrolling left !
							scroll_left = scroll_left + 15;
						}
						container.scrollLeft(scroll_left);
					}
				} else {
					if (overflow_y == 'scroll'){
						var scroll_top = container.scrollTop();
						if(event.originalEvent.wheelDelta /120 > 0){
							//scrolling up !
							scroll_top = scroll_top - 15;
						}
						else {
							//scrolling down !
							scroll_top = scroll_top + 15;
						}
						container.scrollTop(scroll_top);
					}
				}
			});
		}

	} else if (data.type == "element"){
		if (data['class'][0] == 'button' || data['class'][0] == 'label'){
			element = $('.template_canvas_button').clone(true,true);
			element.removeClass('template_canvas_button');

			var label = i_variables.getVariableName(data.attributes, ['label']);
			element.find('.element_content').text(label);

		} else if (data['class'][0] == 'image'){
			element = $('.template_canvas_image').clone(true,true);
			element.removeClass('template_canvas_image');
			var url = i_variables.getVariableValue(data.attributes, ['url']);
			element.attr('src', url);

		} else if (data['class'][0] == 'input'){
			if (data['class'][1] == 'text'){
				element = $('.template_canvas_input_text').clone(true,true);
				element.removeClass('template_canvas_input_text');

				var placeholder = i_variables.getVariableValue(data.attributes, ['placeholder']);
				element.attr('placeholder', placeholder);
			} else if (data['class'][1] == 'radio'){
				element = $('.template_canvas_input_radio').clone(true,true);
				element.removeClass('template_canvas_input_radio');

			} else if (data['class'][1] == 'dropdown'){
				element = $('.template_canvas_input_dropdown').clone(true,true);
				element.removeClass('template_canvas_input_dropdown');
				var options_data = data.special_attributes.options;
				for (var i=0; i<options_data.length; i++){
					var current = options_data[i];
					var option = $('.template_canvas_input_option').clone(true,true);
					option.removeClass('template_canvas_input_option');
					option.text(current.text);
					option.val(current.value);
					element.append(option);
				}

			} else if (data['class'][1] == 'checkbox'){
				element = $('.template_canvas_input_checkbox').clone(true,true);
				element.removeClass('template_canvas_input_checkbox');
				if (data.special_attributes.checked == "true"){
					element.prop('checked', true);
				}

			}
		}
	}

	return element;
};

Canvas.prototype.drawElementStyles = function(element, parent, data){
	var attributes = data.attributes;

	var getPixelValue = function(property_name, parent_dimension){
		var property_value = i_variables.getVariableValue(attributes, [property_name]);
		if (property_value.split('%').length == 2){
		property_value = parent_dimension * parseInt(property_value.split('%')[0]) / 100;
		} else {
			property_value = parseInt(property_value.split('px')[0]);
		}
		return property_value;
	};

	var resolve_dimension = function(dimension_name){
		var dimension = i_variables.getVariableValue(attributes, [dimension_name]);

		var parent_dimension = parent.outerWidth();
		var direction_1 = 'left';
		var direction_2 = 'right';
		if (dimension_name == 'height'){
			parent_dimension = parent.outerHeight();
			direction_1 = 'top';
			direction_2 = 'bottom';
		}

		var value_1 = getPixelValue('border_'+direction_1+'_width', parent_dimension);
		var value_2 = getPixelValue('border_'+direction_2+'_width', parent_dimension);
		var value_3 = getPixelValue('padding_'+direction_1, parent_dimension);
		var value_4 = getPixelValue('padding_'+direction_2, parent_dimension);

		if (dimension.split('%').length == 2){
			dimension = getPixelValue(dimension_name, parent_dimension);
		} else {
			dimension = parseInt(dimension.split('px')[0]);
		}

		dimension = dimension - value_1 - value_2 - value_3 - value_4;
		if (dimension < 0){
			dimension = 0;
		}

		return dimension + 'px';
	};

	var resolveAttribute = function(attribute_name, style_name){
		var attribute_value = i_variables.getVariableValue(attributes, [attribute_name]);
		if (attribute_value == 'inherit'){
			attribute_value = parent.css(style_name);
			if (attribute_name == font_size){
				attribute_name = attribute_name.split('px')[0];
			}
		} else {
			return attribute_value;
		}
	};

	var font_size = resolveAttribute('font_size', 'font-size');
	var color = resolveAttribute('font_color', 'color');

	var style_object = {
		"border-radius": i_variables.getVariableValue(attributes, ['radius_top']) +' '+ i_variables.getVariableValue(attributes, ['radius_right']) +' '+ i_variables.getVariableValue(attributes, ['radius_bottom']) +' '+ i_variables.getVariableValue(attributes, ['radius_left']),
		"background-color": i_variables.getVariableValue(attributes, ['background_color']),
		"background-image": 'url("'+i_variables.getVariableValue(attributes, ['background_image'])+'")',
		"font-size": font_size + 'px',
		"color": color,//i_variables.getVariableValue(attributes, ['font_color']),

		"width": resolve_dimension('width'),
		"height": resolve_dimension('height'),
		"margin": i_variables.getVariableValue(attributes, ['margin_top']) +' '+ i_variables.getVariableValue(attributes, ['margin_right']) +' '+ i_variables.getVariableValue(attributes, ['margin_bottom']) +' '+ i_variables.getVariableValue(attributes, ['margin_left']),
		"padding": i_variables.getVariableValue(attributes, ['padding_top']) +' '+ i_variables.getVariableValue(attributes, ['padding_right']) +' '+ i_variables.getVariableValue(attributes, ['padding_bottom']) +' '+ i_variables.getVariableValue(attributes, ['padding_left']),
		"border-top": i_variables.getVariableValue(attributes, ['border_top_width']) +' '+ i_variables.getVariableValue(attributes, ['border_top_color']),
		"border-right": i_variables.getVariableValue(attributes, ['border_right_width']) +' '+ i_variables.getVariableValue(attributes, ['border_right_color']),
		"border-bottom": i_variables.getVariableValue(attributes, ['border_bottom_width']) +' '+ i_variables.getVariableValue(attributes, ['border_bottom_color']),
		"border-left": i_variables.getVariableValue(attributes, ['border_left_width']) +' '+ i_variables.getVariableValue(attributes, ['border_left_color']),
		"border-style": 'solid'
	};

	var hidden = i_variables.getVariableValue(attributes, ['hidden']);
	if (hidden == 'true'){
		style_object["display"] = 'none';
	}

	var direction = i_variables.getVariableValue(attributes, ['direction']);
	var base_align_x = 'left';
	if (direction != undefined){
		direction = resolveAttribute('direction', 'direction');
		style_object["direction"] = direction;
		if (direction == 'rtl'){
			base_align_x = 'right';
		}

	} else {
		var parent_direction = parent.css('direction');
		if (parent_direction == 'rtl'){
			base_align_x = 'right';
		}
	}

	/** **/
	var content_align_y = i_variables.getVariableValue(data.attributes, ['content_align_y']);
	var content_align_x = i_variables.getVariableValue(data.attributes, ['content_align_x']);

	if (content_align_x != 'inherit'){
		element.addClass('align_set');
		content_align_x = resolveAttribute('content_align_x', 'text-align');

	} else {
		if (parent.hasClass('align_set')){
			element.addClass('align_set');
			content_align_x = resolveAttribute('content_align_x', 'text-align');
		} else {
			content_align_x = base_align_x;
		}

	}

	element.css({"text-align": content_align_x});
	element.find('.align_cell').css({"vertical-align": content_align_y});
	/** **/

	element.css(style_object);
	return element;
};

Canvas.prototype.drawElementPosition = function(element, parent, data){
	var attributes = data.attributes;

	var offset_property_y = 'top';

	var floated = i_variables.getVariableValue(attributes, ['floated']);
	if (floated == 'false'){
		element.addClass('relative');

	} else if (floated == 'true'){
		element.addClass('absolute');

		var offset_property_x = i_variables.getVariableValue(attributes, ['align_x']);
		var offset_property_y = i_variables.getVariableValue(attributes, ['align_y']);
		var attributes_offset_x = i_variables.getVariableValue(attributes, ['offset_x']);
		var attributes_offset_y = i_variables.getVariableValue(attributes, ['offset_y']);

		var style_object = {};

		if (offset_property_x == 'center'){
			//TODO: passing in true gets the width including margins as well. Probably not desired.
			var element_width = element.outerWidth();
			var parent_width = parent.outerWidth();
			var offset_x = (parent_width/2) - (element_width/2);

			style_object.left = (parseInt(attributes_offset_x.split('px')[0]) + offset_x) + 'px';

		} else if (offset_property_x == 'right'){
			style_object[offset_property_x] = (parseInt(attributes_offset_x.split('px')[0])*-1) + 'px';

		} else {
			style_object[offset_property_x] = attributes_offset_x;
		}

		if (offset_property_y == 'middle'){
			//TODO: passing in true gets the width including margins as well. Probably not desired.
			var element_height = element.outerHeight();
			var parent_height = parent.outerHeight();
			var offset_y = (parent_height/2) - (element_height/2);
			style_object.top = (parseInt(attributes_offset_y.split('px')[0]) + offset_y) + 'px';

		} else if (offset_property_y == 'bottom'){
			style_object[offset_property_y] = (parseInt(attributes_offset_y.split('px')[0])*-1) + 'px';

		} else {
			style_object[offset_property_y] = attributes_offset_y;
		}

		element.css(style_object);
	}

	return element;
};

Canvas.prototype.drawElementBindings = function(element, parent, data){
	//draggable
	var floated = i_variables.getVariableValue(data.attributes, ['floated']);
	if (floated == "true"){
		if (element.is('input') || element.is('select') || element.is('textarea')){
			element
				.disableSelection()
				.draggable({
					cancel: null,
					revert: "invalid",
					snap:"td",
					stop: function (event, ui) {},
					start: function (event, ui) {i_canvas.drag_start_position = ui.helper.position();}
				})
				.click(function(){
					$(this).blur();
					var new_state = $(this).prop('checked');
					$(this).prop('checked', !new_state);
				});
		} else {
			element.draggable({
				revert: "invalid",
				snap:"td",
				stop: function (event, ui) {},
				start: function (event, ui) {i_canvas.drag_start_position = ui.helper.position();}
			});
		}
	}

	//click
	if (data.id != "0"){
		element.click(function(event){
			event.stopPropagation();
			i_data.selectElement(data.id);
			i_options.render();
			i_canvas.highlightElement();
		});
	}

	//resizable
	/*element.resizable({
		start: function(event, ui) {}
	});*/

	return element;
};

Canvas.prototype.elementDropHandler = function(droppable, draggable, ui){
	if (draggable.hasClass('palette_icon')){
		this.elementDropNew(droppable, draggable, ui);
	} else if (draggable.hasClass('canvas_element')){
		this.elementDropExisting(droppable, draggable, ui);
	}
};

Canvas.prototype.elementDropExisting = function(droppable, draggable, ui){
	var droppable_id = droppable.attr('element-id');
	var child_id = draggable.attr('element-id');

	var page_data = i_data.returnSelectedPageData();

	var data =  page_data.data.ui[child_id];

	var droppable_data = page_data.data.ui[droppable_id];
	var droppable_resolved = i_data.resolveElementData(droppable_data);
	droppable_data = i_data.getElementDataReference(droppable_data);

	if (!droppable_data.children){
		droppable_data.children = JSON.parse(JSON.stringify(droppable_resolved.children));
	}

	if (droppable_data.children.indexOf(child_id) == -1){
		i_data.migrateElement(child_id, droppable_id);

		this.elementDropPositionNew(droppable, draggable, ui, data);

	} else {
		//if parent has it, simply shift the position
		this.elementDropPositionDelta(droppable, draggable, ui, data);
	}

	this.render();
	$('.canvas').find('[element-id="'+child_id+'"]').click();
};

Canvas.prototype.elementDropNew = function(droppable, draggable, ui){
	//Prepare element data to insert
	var data_instructions = draggable.attr('data');
	data_instructions = data_instructions.split('>');
	data_instructions = i_data_objects[data_instructions[0]][data_instructions[1]].elements[data_instructions[2]];

	var data = JSON.parse(JSON.stringify(i_data_objects.base_elements[data_instructions.base]));

	for (var i in data_instructions.overrides){
		//TODO: These with the new attributes scheme of course
		data.attributes[i] = data.overrides[i];
	}

	data = this.elementDropPositionNew(droppable, draggable, ui, data);

	//insert
	var parent_id = droppable.attr('element-id');
	var new_id = i_data.insertElement(data, parent_id)

	this.render();
	$('.canvas').find('[element-id="'+new_id+'"]').click();

};

Canvas.prototype.elementDropPositionNew = function(droppable, draggable, ui, data){
	var data_aggregate = i_data.resolveElementData(data);
	var data_reference = i_data.getElementDataReference(data);

	var floated = i_variables.getVariableValue(data_aggregate.attributes, ['floated']);
	if (floated == 'true'){

		var droppable_x_position = droppable.offset().left;
		var droppable_y_position = droppable.offset().top;

		var draggable_x_position = i_variables.encodeVariable( parseInt(ui.offset.left - droppable_x_position) + 'px' );
		var draggable_y_position = i_variables.encodeVariable( parseInt(ui.offset.top - droppable_y_position) + 'px' );

		//This should probably not happen here. However, the setElementAttribute takes an id and the data here doesn't have id yet
		if (!data_reference.attributes){
			data_reference.attributes = {
				"type": 'object',
				"value": {},
				"value_bound": {}
			};
		}
		var map = [];
		i_variables.write(draggable_x_position, data_reference.attributes, map, 'insert', 'offset_x');
		i_variables.write(draggable_y_position, data_reference.attributes, map, 'insert', 'offset_y');

	} else if (floated == 'false'){

	}

	return data;
};

Canvas.prototype.elementDropPositionDelta = function(droppable, draggable, ui, data){
	var resolved_data = i_data.resolveElementData(data);
	data = i_data.getElementDataReference(data);

	var delta_x = ui.position.left - this.drag_start_position.left;
	var delta_y = ui.position.top - this.drag_start_position.top;

	var offset_property_x = i_variables.getVariableValue(resolved_data.attributes, ['align_x']);
	var offset_property_y = i_variables.getVariableValue(resolved_data.attributes, ['align_y']);
	var attributes_offset_x = i_variables.getVariableValue(resolved_data.attributes, ['offset_x']);
	var attributes_offset_y = i_variables.getVariableValue(resolved_data.attributes, ['offset_y']);

	if (!data.attributes){
		data.attributes = {
			"type": 'object',
			"value": {},
			"value_bound": {}
		};
	}
	var attributes = data.attributes;

	var new_value;
	var map = [];
	if (offset_property_x == 'left'){
		var new_value = ui.position.left + 'px';

	} else if (offset_property_x == 'right'){
		var new_value = (parseInt(attributes_offset_x) + (delta_x)) + 'px';

	} else if (offset_property_x == 'center'){
		var new_value = (parseInt(attributes_offset_x) + (delta_x)) + 'px';
	}
	new_value = i_variables.encodeVariable(new_value);
	i_variables.write(new_value, attributes, map, 'insert', 'offset_x');
	//i_variables.write(new_value, attributes, ['offset_x'], 'set');

	var new_value;
	if (offset_property_y == 'top'){
		var new_value = ui.position.top + 'px';

	} else if (offset_property_y == 'bottom'){
		var new_value = (parseInt(attributes_offset_y) + (delta_y)) + 'px';

	} else if (offset_property_y == 'middle'){
		var new_value = (parseInt(attributes_offset_y) + (delta_y)) + 'px';
	}
	new_value = i_variables.encodeVariable(new_value);
	i_variables.write(new_value, attributes, map, 'insert', 'offset_y');
	//i_variables.write(new_value, attributes, ['offset_y'], 'set');

};

Canvas.prototype.highlightElement = function(){
	var element_id = i_data.returnSelectedPageData().selected_element;
	if (element_id == undefined){
		this.removeHighlight();
		return;
	}
	var element = $('.canvas [element-id="'+element_id+'"]');
	var parent = element.parent();

	$('.canvas .canvas_element').addClass('faded');
	$('.canvas .canvas_element').removeClass('selected_parent');
	$('.canvas .canvas_element').removeClass('selected_element');
	$('.canvas .canvas_layout').removeClass('faded');

	element.removeClass('faded');
	element.addClass('selected_element');
};

Canvas.prototype.removeHighlight = function(){
	$('.canvas .canvas_element').removeClass('faded');
	$('.canvas .canvas_element').removeClass('selected_parent');
	$('.canvas .canvas_element').removeClass('selected_element');
};

Canvas.prototype.scrollLayout = function(ev, delta){
	var scrollTop = $(this).scrollTop();
    $(this).scrollTop(scrollTop-Math.round(delta));
};

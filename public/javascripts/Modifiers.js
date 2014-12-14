function Modifiers(){
	this.active = {};
	
	this.render();
}

Modifiers.prototype.render = function(){
	var modifiers_list = $('.modifiers .list');
	modifiers_list.empty();
	
	for (var i in this.active){
		var modifier_item = $('.template_modifier_item').clone(true,true);
		modifier_item.removeClass('template_modifier_item');
		
		var name = i;
		var value = this.active[i];
		var value_text = value.value;
		
		if (!jQuery.isEmptyObject(value.value_bound)){
			value_text = value.value_bound.reference.type;
		}
		
		modifier_item.attr('name', name);
		modifier_item.attr('value', JSON.stringify(value));
		
		var modifier_string =  name + ':' + value_text;
		modifier_item.find('.name').text(modifier_string);
		
		modifiers_list.append(modifier_item);
	}
	
};

Modifiers.prototype.createModifierInitClicked = function(button){
	var name = prompt("Attribute name?", "lang");
	if (name == null){
		return;
	}
	var button = $(button);
	var creator = button.closest('.modifiers').find('.modifier_creator');
	
	creator.show();
	
	var item = creator.find('.modifier_tag_item');
	item.attr('tag-name', name);
	item.find('.name').text(name);
};

Modifiers.prototype.cancelModifierClicked = function(button){
	var button = $(button);
	var creator = button.closest('.modifiers').find('.modifier_creator');
	creator.hide();
};

Modifiers.prototype.referenceValueClicked = function(button){
	var button = $(button);
	
	if (button.hasClass('bound')){
		var modifier_creator = $('.modifier_creator');
	
		var html = modifier_creator.find('.workspace_field');
		var data = {
			"type": 'value',
			"value": '',
			"value_bound": {}
		};
		i_workspace.formatField(html, data);
		
		modifier_creator.removeAttr('reference');
		
		return;
	}
	
	var value = 'value';
	var callback = this.referenceValue;
	i_workspace.open(value, callback, '0');
};

Modifiers.prototype.referenceValue = function (response){
	var modifier_creator = $('.modifier_creator');
	
	var html = modifier_creator.find('.workspace_field');
	var data = {
		"type": 'value',
		"value": '',
		"value_bound": JSON.parse(JSON.stringify(response))
	};
	i_workspace.formatField(html, data);
	
	modifier_creator.attr('reference', JSON.stringify(response));
};

Modifiers.prototype.createModifierDoneClicked = function(button){
	var button = $(button);
	
	var creator = button.closest('.modifiers').find('.modifier_creator');
	var list = button.closest('.modifier_creator').find('.modifier_creator_list');
	var tag = list.find('.modifier_tag_item');
	
	var name = tag.find('.name').text();
	var value = tag.find('.value').val();
	
	if (value == ''){
		alert('Value cannot be empty. For something like "selected", use something like "true"');
		return;
	}
	
	var value_bound = creator.attr('reference');
	if (!value_bound){
		value_bound = {};
	} else {
		value_bound = JSON.parse(value_bound);
		value = '';
	}
	var encoded_object = {
		"type": 'value',
		"value": value,
		"value_bound": value_bound
	};
	
	i_modifiers.active[name] = encoded_object;
	
	creator.hide();
	
	i_canvas.render();
	i_options.render();
};

Modifiers.prototype.removeModifierClicked = function(button){
	var button = $(button);
	var item = button.closest('.modifier_item');
	
	var name = item.attr('name');
	
	delete i_modifiers.active[name];
	
	i_canvas.render();
	i_options.render();
	
};

Modifiers.prototype.getModifierKey = function(){
	var object = this.active;
	if (jQuery.isEmptyObject(object)){
		return false;
	}
	
	var output = [];

	for (var i in object){
		var pair = {};
		//pair[i] = i_variables.object[i];
		pair[i] = i_variables.decodeVariable(object[i]);

		output.push(pair);
	}

	output.sort(function(a, b){
		var nameA;
		var nameB;
		for (var i in a){
			nameA = i.toLowerCase();
		}
		for (var i in b){
			nameB = i.toLowerCase();
		}
		if (nameA < nameB) {
			return -1
		}           if (nameA > nameB){
			return 1
		}
		return 0 //default return value (no sorting)
	});
	
	output = i_variables.encodeVariable(output);
	
	return JSON.stringify(output);
};

Modifiers.prototype.returnActiveKeys = function(modifiers){
	active_keys = [];
	
	for (var i in modifiers){
		var array = JSON.parse(i);
		
		var is_active = true;
		
		for (var j=0; j<array.value.length; j++){
			var current_pair = array.value[j].value;
			for (var k in current_pair){
				var name = k;
				var value = current_pair[k];
				
				if (!this.active[name]){
					is_active = false;
				} else if (JSON.stringify(this.active[name]) != JSON.stringify(value)){
					is_active = false;
				}
			}
		}
		
		if (is_active){
			active_keys.push(i);
		}
	}
	
	//TODO: sort, more specific has more priority
	return active_keys;
};
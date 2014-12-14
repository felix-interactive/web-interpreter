//TODO: expandMap instead of simplifyMap

function Variables(){
	this.base_variables = {
		"type": 'object',
		"permissions": {"edit": "editor", "delete": "editor"},
		"value": {
			"app": {
				"type": 'object',
				"permissions": {"edit": "editor", "delete": "editor"},
				"value": {
					"Pages": {
						"type": "array",
						"permissions": {"edit": "editor", "delete": "editor"},
						"value": [],
						"value_bound": {}
					},
					"Forms": {
						"type": "array",
						"permissions": {"edit": "editor", "delete": "editor"},
						"value": [],
						"value_bound": {}
					},
					"Data_Sources": {
						"type": 'object',
						"permissions": {"edit": "editor", "delete": "editor"},
						"value": {},
						"value_bound": {}
					}
				}
			},
			"page_variables": {
				"type": 'object',
				"permissions": {"edit": "publisher", "delete": "editor"},
				"value": {},
				"value_bound": {}
			},
			"context": {
				"type": 'object',
				"permissions": {"edit": "editor", "delete": "editor"},
				"value": {
					
				},
				"value_bound": {}
			}
		}
	};
	this.stack = [];
}

Variables.prototype.open = function (type, callback){
	i_actions.callback = callback;
	
	var variables_container = $('.template_variables_container').clone(true,true);
	variables_container.removeClass('template_variables_container');
	variables_container.addClass('variables_container');
	variables_container.attr('order', this.stack.length);
	
	var stack_object = {
		"type": type,
		"callback": callback,
		"open_nodes": {},
		"open_nodes_counter": 0,
		"ws_pending_map": []
	};
	
	this.stack.push(stack_object);
	
	return variables_container;
};

Variables.prototype.popStack = function(){
	i_variables.stack.pop();
};

Variables.prototype.render = function(order){
	var container = $('.workspace_container').filter('[order="'+ order +'"]').find('.variables_container .inner');
	container.empty();
	
	i_variables.prepareContext();
	
	var variables = i_app_data.getVariableObjectReference();
	
	var tree = i_variables.buildTree(variables, 'Variables');
	tree.addClass('root');
	tree.children('.children').addClass('open');
	
	/*object_creator*/
	tree.find('[selector="context"]').addClass('object_creator_parent');
	/**/
	
	container.append(tree);
	i_variables.openTree();
};

Variables.prototype.prepareContext = function(){
	var context = i_workspace.getContext();
	var variable_contexts = i_data.getVariableContexts(context);
	
	var location = i_app_data.getVariableObjectReference();
	i_variables.write(variable_contexts, location, [], 'insert', 'context');
	
	//This happens already in write()
	//i_data.saveAppVariables();
	//TODO: Does it though?
	
};

Variables.prototype.buildTree = function(variable, name, selector){
	var item = $('.template_variables_item').clone(true,true);
	item.removeClass('template_variables_item');
	
	item.attr('type', variable.type);
	item.attr('selector', selector);
	item.children('.subclass_header').find('.name').text(name);
	item.children('.subclass_header').children('.type').text(variable.type);
	
	var workspace_field = item.children('.subclass_header').find('.workspace_field');
	i_workspace.formatField(workspace_field, variable);
	
	//type
	if (variable.type == 'value'){
		item.children('.children').remove();
		
	} else if (variable.type == 'object'){
		for (var i in variable.value){
			item.children('.children').children('.list').append(i_variables.buildTree(variable.value[i], i, i));
		}
		
	} else if (variable.type == 'array'){
		for (var i=0; i<variable.value.length; i++){
			item.children('.children').children('.list').append(i_variables.buildTree(variable.value[i], i, i));
		}
	}
	
	//bound
	if (!jQuery.isEmptyObject(variable.value_bound)){
		item.children('.children').remove();
	}
	
	//returns or not
	var order = i_variables.stack.length - 1;
	var requested_type = i_variables.stack[order].type;
	if (requested_type != 'location'){
		if (variable.type != requested_type){
			item.children('.subclass_header').children('.return_buttons').remove();
		}
	}
	
	//permissions
	if (variable.permissions){
		if (variable.permissions.edit != 'publisher'){
			item.children('.subclass_header').find('.workspace_button').remove();
			item.children('.subclass_header').find('input').attr('disabled', 'disabled');
			item.children('.children').children('.add').remove();
			
		}
	} else {
		console.log(variable);
	}
	
	return item;
};

Variables.prototype.openTree = function(){
	var order = i_variables.stack.length - 1;
	
	for (var i in i_variables.stack[order].open_nodes){
		var current = i_variables.stack[order].open_nodes[i];
		var item = i_variables.getItemHtmlFromMap(current);
		item.attr('open-node-id', i);
		item.children('.children').addClass('open');
		
	}
};

Variables.prototype.toggleClicked = function(button){
	var button = $(button);
	if (button.hasClass('root') || button.attr('type') == 'value'){
		return;
	}
	
	var item = button;
	
	var open_node_id = item.attr('open-node-id');
	var order = i_variables.stack.length - 1;
	if (!open_node_id){
		var map = i_variables.createMap(item);
		i_variables.stack[order].open_nodes[i_variables.stack[order].open_nodes_counter] = map;
		i_variables.stack[order].open_nodes_counter++;
		
	} else {
		delete i_variables.stack[order].open_nodes[open_node_id];
	}
	
	var order = i_variables.stack.length - 1;
	i_variables.render(order);
	
};

Variables.prototype.useItemClicked = function(button, action){
	var button = $(button);
	var item = button.closest('.item');
	
	var name = item.children('.subclass_header').find('.name').text();
	var type = item.attr('type');
	
	var map = i_variables.createMap(item);
	
	var order = i_variables.stack.length - 1;
	
	
	if (action == 'clone'){
		var clone = i_variables.getSubvariable(i_app_data.getVariableObjectReference(), i_variables.simplifyMap(map));
		clone = JSON.parse(JSON.stringify(clone));
		i_variables.adjustPermissions(clone);
		
		//TODO: This path will be different.. discrepancy of where the variables are stored again.
		var location = i_data.returnSelectedPageData().data.ui[i_workspace.getContext()].variables;
		var map = [];
		i_variables.write(clone, location, map, 'insert', name);
		
		//TODO: open the context if not already open
		i_variables.render(order);
		
	} else if (action == 'reference'){
		console.log(JSON.parse(JSON.stringify(map)));
		var response = {
			"name": 'Variables > ' + name,
			"type": type,
			"reference": {
				"type": 'variable',
				"map": map
			}
		};
		if (i_variables.stack[order].type == 'location'){
			response.reference['return'] = 'location';
		}
		
		i_variables.stack[order].callback(response);
		
	} else if (action == 'use'){
		var clone = i_variables.getSubvariable(i_app_data.getVariableObjectReference(), i_variables.simplifyMap(map));
		clone = JSON.parse(JSON.stringify(clone));
		i_variables.adjustPermissions(clone);
		
		response = {
			"name": 'clone of '+type,
			"type": type,
			"reference": {
				"type": 'variable_clone',
				"clone": clone
			}
		};
		
		i_variables.stack[order].callback(response);
	}
};

Variables.prototype.createMap = function(item){
	var map = [];
	
	var createMapObject = function(f_item){
		var f_item_selector = f_item.attr('selector');
		var f_map_object_type;
		if (f_item.parent().closest('.item').attr('type') == 'array'){
			f_map_object_type = 'index';
			f_item_selector = parseInt(f_item_selector);
		} else if (f_item.parent().closest('.item').attr('type') == 'object'){
			f_map_object_type = 'key';
		}
		var f_map_object = {"type": f_map_object_type, "value": f_item_selector};
		return f_map_object;
	};
	
	var parents = item.parents('.variables_container .item');
	for (var i=0; i<parents.length; i++){
		var current = $(parents[i]);
		var map_object = createMapObject(current);
		map.unshift(map_object);
	}
	var map_object = createMapObject(item);
	map.push(map_object);
	map.shift();
	
	return map;
};

Variables.prototype.simplifyMap = function(map){
	var simple_map = [];
	for (var i=0; i<map.length; i++){
		simple_map.push(map[i].value);
	}
	return simple_map;
};

//is this too similar to setVariableValue? Maybe do splice for what we're trying to achieve
Variables.prototype.write = function(variable, location, map, action, key){
	location = i_variables.getSubvariable(location, map);
	
	if (action == 'push'){
		location.value.push(variable);
		
	} else if (action == 'insert'){
		location.value[key] = variable;
		
	} else if (action == 'edit'){
		location.value = variable;
		
	} else if (action == 'set'){
		location.value = variable.value
		
	}
	
	//there should be no edit.. instead ron encode the variable
	
};

/*
Variables.prototype.setVariableValue = function(object, map, value){
	var starting_node = i_variables.getSubvariable(object, map);
	starting_node.value = value.value;
};
*/

Variables.prototype.getSubvariable = function(object, map){
	var starting_node = object;
	for (var i = 0; i<map.length; i++){
		var key = map[i];
		if (!starting_node){
			//console.log(object);
			//console.log(map);
		}
		if (!starting_node.value){
			console.trace();
		}
		starting_node = starting_node.value[key];
		if (starting_node == undefined){
			return;
		}
	}
	return starting_node;
};

Variables.prototype.addClicked = function(button){
	var button = $(button);
	var item = button.closest('.item');
	
	var type = prompt("What type of variable do you want to add? Valid choices are: array, value, object", "Pick type..");
	if (type == null){
		return;
	} if (type != 'array' && type != 'value' && type != 'object'){
		console.log('quitting on account of bad input');
		return;
	}
	var name = prompt("What will the variable be called? For now, don't use spaces or unusual characters. Underscores are fine.", "Pick name..");
	if (name == null){
		return;
	}
	var permissions = {"edit": 'publisher', "delete": 'publisher'};
	
	var variable = {
		"type": type,
		"permissions": permissions,
		"value": '',
		"value_bound": {}
	};
	if (type == 'array'){
		variable.value = [];
	} else if (type == 'object'){
		variable.value = {};
	}
	
	var action = 'insert';
	if (item.attr('type') == 'array'){
		action = 'push';
		variable.name = name;
	}
	
	var map = i_variables.createMap(item);
	map = i_variables.simplifyMap(map);
	var location;
	
	if (map[0] == 'context'){
		location = i_data.returnSelectedPageData().data.ui[map[1]].variables;
		map.splice(0, 2);
		i_variables.write(variable, location, map, action, name);
	} else {
		location = i_app_data.getVariableObjectReference();
		i_variables.write(variable, location, map, action, name);
	}
	
	var order = i_variables.stack.length - 1;
	i_variables.render(order);
};

Variables.prototype.inputChanged = function(input){
	var input = $(input);
	
	var value = input.val();
	
	var item = input.closest('.item');
	var map = i_variables.createMap(item);
	map = i_variables.simplifyMap(map);
	
	var location;
	
	if (map[0] == 'context'){
		location = i_data.returnSelectedPageData().data.ui[map[1]].variables;
		map.splice(0, 2);
		value = i_variables.encodeVariable(value);
		i_variables.write(value, location, map, 'set');
	} else {
		location = i_app_data.getVariableObjectReference();
		value = i_variables.encodeVariable(value);
		i_variables.write(value, location, map, 'set');
	}
	
	var order = i_variables.stack.length - 1;
	i_variables.render(order);
};

Variables.prototype.editValueClicked = function(button){
	var button = $(button);
	
	var value = prompt("Type in a new value", "New value..");
	if (value == null){
		return;
	}
	
	var item = button.closest('.item');
	var map = i_variables.createMap(item);
	map = i_variables.simplifyMap(map);
	
	var location = i_app_data.getVariableObjectReference();
	value = i_variables.encodeVariable(value);
	i_variables.write(value, location, map, 'set');
	
	var order = i_variables.stack.length - 1;
	i_variables.render(order);
};

Variables.prototype.getItemHtmlFromMap = function(map){
	var order = i_variables.stack.length - 1;
	var container = $('.workspace_container').filter('[order="'+ order +'"]').find('.variables_container .inner .root');
	container = container.children('.children').children('.list');
	
	var item;
	for (var i=0; i<map.length; i++){
		var current = map[i].value;
		item = container.children('[selector="'+current+'"]');
		container = item.children('.children').children('.list');
	}
	
	return item;
};

Variables.prototype.attachReferenceClicked = function(button){
	var button = $(button);
	
	var item = button.closest('.item');
	var map = i_variables.createMap(item);
	map = i_variables.simplifyMap(map);
	
	var order = i_variables.stack.length - 1;
	i_variables.stack[order].ws_pending_map = map;
	
	if (button.hasClass('bound')){
		i_variables.unattachReference();
		return;
	}
	
	var type = item.attr('type');
	var callback = this.attachReference;
	i_workspace.open(type, callback);
	
};

Variables.prototype.attachReference = function(response){
	var object = i_app_data.getVariableObjectReference();
	var order = i_variables.stack.length - 1;
	var map = i_variables.stack[order].ws_pending_map;
	
	i_variables.setVariableValueBound(object, map, response);
	i_variables.render(order);
};

Variables.prototype.unattachReference = function(){
	var object = i_app_data.getVariableObjectReference();
	var order = i_variables.stack.length - 1;
	var map = i_variables.stack[order].ws_pending_map;
	i_variables.unsetVariableValueBound(object, map);
	i_variables.render(order);
};

/****/

Variables.prototype.adjustPermissions = function(variable){
	var variable = variable;
	
	var adjust = function(f_variable){
		f_variable.permissions = {"edit": "publisher", "delete": "publisher"};
		if (f_variable.type == 'object'){
			for (var i in f_variable.value){
				adjust(f_variable.value[i]);
			}
		} else if (f_variable.type == 'array'){
			for (var i=0; i<variable.value.length; i++){
				adjust(f_variable.value[i]);
			}
		}
	};
	
	adjust(variable);
	
	return variable;
	
};

Variables.prototype.getVariableValue = function(object, map){
	var starting_node = i_variables.getSubvariable(object, map);
	
	if (starting_node == undefined){return;}
	
	var addLayer = function(item, node, key){
		var layer;
		if (node.type == 'object'){
			layer = {};
			for (var i in node.value){
				layer = addLayer(layer, node.value[i], i);
			}
		} else if (node.type == 'array'){
			layer = [];
			for (var i=0; i<node.value.length; i++){
				layer = addLayer(layer, node.value[i]);
			}
		} else if (node.type == 'value'){
			layer = node.value;
		}
		
		if (item == undefined) {
			item = layer;
		} else if (item instanceof Array){
			item.push(layer);
		} else if (item instanceof Object){
			item[key] = layer;
		}
		return item;
	};
	
	var final_item;
	var final_item = addLayer(final_item, starting_node);
	
	return final_item;
	
};

//TODO: Remove once obsolete
Variables.prototype.setVariableValueBound = function(object, map, value){
	var starting_node = i_variables.getSubvariable(object, map);
	starting_node.value_bound = value;
	
	i_data.saveAppVariables();
};

Variables.prototype.unsetVariableValueBound = function(object, map){
	var starting_node = i_variables.getSubvariable(object, map);
	starting_node.value_bound = {};
	
	i_data.saveAppVariables();
};

Variables.prototype.encodeVariable = function(item){
	var variable;
	
	if (item.reference){
		var value = '';
		if (item.type == 'object'){
			value = {}
		} else if (item.type == 'array' || item.type == 'data_source'){
			value = [];
		}
		variable = {
			"type": item.type,
			"value": value,
			"value_bound": item
		};
		return variable;
	};
	
	var layer;
	if (item instanceof Array){
		layer = [];
		for (var i=0; i<item.length; i++){
			layer.push(i_variables.encodeVariable(item[i]));
		}
		variable = {
			"type": 'array',
			"value": layer,
			"value_bound": {}
		};
		
	} else if (item instanceof Object){
		layer = {};
		for (var i in item){
			layer[i] = i_variables.encodeVariable(item[i]);
		}
		variable = {
			"type": 'object',
			"value": layer,
			"value_bound": {}
		};
	} else {
		layer = item;
		variable = {
			"type": 'value',
			"value": layer,
			"value_bound": {}
		};
	}
	
	return variable;
};

Variables.prototype.decodeVariable = function(item){
	var variable;
	
	if (!jQuery.isEmptyObject(item.value_bound)){
		variable = item.value_bound;
		return variable;
	}
	
	if (item.type == 'array'){
		variable = [];
		for (var i=0; i<item.value.length; i++){
			variable.push(i_variables.decodeVariable(item.value[i]));
		}
	} else if (item.type == 'object'){
		variable = {};
		for (var i in item.value){
			variable[i] = i_variables.decodeVariable(item.value[i])
		}
	} else {
		variable = item.value;
	}
	
	return variable;
};

Variables.prototype.getVariableName = function(object, map){
	var starting_node = i_variables.getSubvariable(object, map);
	
	var name;
	if (jQuery.isEmptyObject(starting_node.value_bound)){
		if (starting_node.type == 'value'){
			name = starting_node.value;
		} else {
			name = starting_node.type;
		}
	} else {
		name = starting_node.value_bound.name;
	}
	return name;
};
/***
	-Element management
		resolveElementData
		insertElement
		removeElement
		
		setElementAttribute
		setElementAttributeValue
		unsetElementAttributeValue
		
		setLayoutDataSource
		unsetLayoutDataSource
		
		selectElement
		
		addElementBinding
		setElementActionParameter
		
		setElementActionParameterWorkspace
		unsetElementActionParameterWorkspace
	
	-Data source management
		publishDataSources
		generateDataSourceId
		getDataSourceByInternalId
		getContexts
		
	-Form management
		publishForm
		
	-Actions management
		generateActionSequenceId
		getActionSequences
		
	-Variables management
		getVariableContexts
		saveAppVariables

	-Widget management (separate class that interfaces with widgets)
		createWidgetStorage
		getWidgetStorage
		
	TODOS:
		Will this class be the interface between all the data classes and the rest of the app?
		premades (first make a premades class or system)
		
***/

function Data (){
	
	this.registered_widgets = [];
	
	this.data_source_counter = 0;
	
	this.action_sequence_counter = 0;
	this.custom_action_counter = 0;
	
	
};

/** Element management **/

Data.prototype.createModifier = function(element_id, key){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data, true);
	
	data.modifiers[key] = {};
	
	i_data.createElementTag(element_id);
};

Data.prototype.removeModifier = function(element_id, key){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data, true);
	
	delete data.modifiers[key];
};

Data.prototype.createElementTag = function(element_id, name){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data, true);
	
	data.tags[name] = '';
};

Data.prototype.removeElementTag = function(element_id, name){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data, true);
	
	delete data.tags[name];
};

Data.prototype.editElementTag = function(element_id, name, value){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data, true);
	
	data.tags[name] = value;
};

Data.prototype.createElementState = function(element_id, name){
	var page_data = this.returnSelectedPageData();
	var element_info = page_data.data.ui[element_id];
	
	var base_info = element_info.states['base'];
	
	element_info.states[name] = {
		"class": JSON.parse(JSON.stringify(base_info['class'])),
		"attributes": JSON.parse(JSON.stringify(base_info['attributes'])),
		"data_source": {},
		"variables": {"type": 'object', "value": {}, "value_bound": {}},
		"children": [],
		"bindings_raw": {
			"tap": [],
			"swipe_up": [],
			"swipe_down": [],
			"swipe_right": [],
			"swipe_left": [],
			"fetch_sequence": []
		},
		"modifiers": {}
	};
	
	element_info.active_state = name;
	
};

Data.prototype.removeElementState = function(element_id, name){
	var page_data = this.returnSelectedPageData();
	var element_data = page_data.data.ui[element_id];
	
	if (element_data.active_state == name){
		element_data.active_state = element_data.start_state;
	}
	
	var state_reference = i_data.getStateReferenceByName(element_data, name);
	
	while (state_reference.children.length > 0){
		var child_id = state_reference.children[0];
		this.removeElement(child_id);
	}
	
	delete element_data.states[name];
};

Data.prototype.setStartState = function(element_id, name){
	var page_data = this.returnSelectedPageData();
	var element_info = page_data.data.ui[element_id];
	
	element_info.start_state = name;
};

Data.prototype.setActiveState = function(element_id, name){
	var page_data = this.returnSelectedPageData();
	var element_info = page_data.data.ui[element_id];
	
	element_info.active_state = name;
};

Data.prototype.removeElement = function(element_id){
	var page_data = this.returnSelectedPageData();
	
	var data = page_data.data.ui[element_id];
	
	data = i_data.getElementDataReference(data);
	
	if (data.type == 'layout'){
		if (data.children){
			while (data.children.length > 0){
				var child_id = data.children[0];
				this.removeElement(child_id);
			}
		}
	}
	
	/*
	if (data.type == 'layout'){
		for (var i in data.states){
			var state_reference = i_data.getStateReferenceByName(data, i);
			while (state_reference.children.length > 0){
				var child_id = state_reference.children[0];
				this.removeElement(child_id);
			}
		}
	}
	
	data = i_data.getElementDataReference(data);
	*/
	
	var parent_id = data.parent_id;
	var parent_data = page_data.data.ui[parent_id];
	
	var resolved_parent_data = i_data.resolveElementData(parent_data);
	
	parent_data = i_data.getElementDataReference(parent_data);
	
	if (!parent_data.children){
		parent_data.children = JSON.parse(JSON.stringify(resolved_parent_data.children));
	}
	
	var child_index = parent_data.children.indexOf(element_id);
	if (child_index > -1) {
		parent_data.children.splice(child_index, 1);
	}
	
	//TODO: only if others are not using it..
	//delete page_data.data.ui[element_id];
	
	this.selectElement(undefined);
};

Data.prototype.migrateElement = function(element_id, new_parent_id){
	var page_data = this.returnSelectedPageData();
	
	var data = page_data.data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	var old_parent_data = page_data.data.ui[data.parent_id];
	var resolved_old_parent = i_data.resolveElementData(old_parent_data);
	old_parent_data = i_data.getElementDataReference(old_parent_data);
	
	if (!old_parent_data.children){
		old_parent_data.children = JSON.parse(JSON.stringify(resolved_old_parent.children));
	}
	
	var index = old_parent_data.children.indexOf(element_id);
	if (index > -1){
		old_parent_data.children.splice(index, 1);
	}
	
	var new_parent_data = page_data.data.ui[new_parent_id];
	//resolving happens in Canvas.. is this ok?
	new_parent_data = i_data.getElementDataReference(new_parent_data);
	
	new_parent_data.children.push(element_id);
	
	data.parent_id = new_parent_id;
	
};

Data.prototype.insertElement = function(data, parent_id){
	var page_data = this.returnSelectedPageData();
	
	var parent_data = page_data.data.ui[parent_id];
	var resolved_data = i_data.resolveElementData(parent_data);
	parent_data = i_data.getElementDataReference(parent_data);
	
	if (!parent_data.children){
		parent_data.children = JSON.parse(JSON.stringify(resolved_data.children));
	}
	
	var new_id = page_data.id_counter.toString();
	parent_data.children.push(new_id);
	
	data.id = new_id;
	data.parent_id = parent_id;
	
	page_data.data.ui[new_id] = data;
	
	page_data.id_counter++;
	return (page_data.id_counter - 1).toString();
};

Data.prototype.getElementDataReference = function(data, ignore_modifiers){
	var reference = data;
	
	var type = JSON.parse(JSON.stringify(data.type));
	var parent_id;
	if (data.parent_id){
		parent_id = JSON.parse(JSON.stringify(data.parent_id));
	}
	var id;
	if (data.id){
		id = JSON.parse(JSON.stringify(data.id));
	}
	
	if (type == 'layout'){
		reference = data.states[data.active_state];
		reference.parent_id = parent_id;
	}
	
	if (!ignore_modifiers){
		var modifier_key = i_modifiers.getModifierKey();
		if (modifier_key){
			if (!reference.modifiers[modifier_key]){
				reference.modifiers[modifier_key] = {};
			}
			if (!reference.modifiers[modifier_key].parent_id){
				reference.modifiers[modifier_key].parent_id = parent_id;
			}
			return reference.modifiers[modifier_key];
		}
	}
	
	reference.type = type;
	reference.id = id;
	
	return reference;
	
};

Data.prototype.resolveElementData = function(data){
	data = JSON.parse(JSON.stringify(data));
	
	var type = JSON.parse(JSON.stringify(data.type));
	var parent_id;
	if (data.parent_id){
		parent_id = JSON.parse(JSON.stringify(data.parent_id));
	}
	var id;
	if (data.id){
		id = JSON.parse(JSON.stringify(data.id));
	}
	
	if (type == 'layout'){
		data = JSON.parse(JSON.stringify(data.states[data.active_state]));
		data.type = type;
		data.id = id;
		data.parent_id = parent_id;
	}
	
	var active_modifiers = i_modifiers.returnActiveKeys(data.modifiers);
	for (var i=0; i<active_modifiers.length; i++){
		
		var modifier = data.modifiers[active_modifiers[i]];
		//attributes
		if (modifier.attributes){
			for (var j in modifier.attributes.value){
				var value = modifier.attributes.value[j];
				i_variables.write(value, data.attributes, [], 'insert', j);
			}
		}
		
		//data_sources
		if (modifier.data_source){
			data.data_source = JSON.parse(JSON.stringify(modifier.data_source));
		}
		
		//bindings
		if (modifier.bindings_raw){
			for (var j in modifier.bindings_raw){
				data.bindings_raw[j] = JSON.parse(JSON.stringify(modifier.bindings_raw[j]));
			}
		}
		
		//parent
		if (modifier.parent_id){
			data.parent_id = modifier.parent_id;
		}
		
		//children
		if (modifier.children){
			data.children = modifier.children;
		}
		
	}
	delete data.modifiers;
	
	return data;
};

Data.prototype.getActiveState = function(data){
	return data.active_state;
};

Data.prototype.getStateReferenceByName = function(data, name){
	return data.states[name];
};

Data.prototype.setElementAttribute = function(element_id, property, value){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	if (!data.attributes){
		data.attributes = {
			"type": 'object',
			"value": {},
			"value_bound": {}
		};
	}
	
	var location = data.attributes;
	var map = [];
	value = i_variables.encodeVariable(value);
	i_variables.write(value, location, map, 'insert', property)
	
};

Data.prototype.setElementAttributeValue = function(element_id, attribute, source){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	if (!data.attributes){
		data.attributes = {
			"type": 'object',
			"value": {},
			"value_bound": {}
		};
		var value = {
			"type": "value",
			"value": "",
			"value_bound": {}
		};
		i_variables.write(value, data.attributes, [], 'insert', attribute)
	}
	
	i_variables.setVariableValueBound(data.attributes, [attribute], source);
};

Data.prototype.unsetElementAttributeValue = function(element_id, attribute){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	if (!data.attributes){
		data.attributes = {
			"type": 'object',
			"value": {},
			"value_bound": {}
		};
		var value = {
			"type": "value",
			"value": "",
			"value_bound": {}
		};
		i_variables.write(value, data.attributes, [], 'insert', attribute)
	}

	i_variables.setVariableValueBound(data.attributes, [attribute], {});
};

Data.prototype.setLayoutDataSource = function(element_id, source){
	//TODOL: the interpreters only need the location, so make this part of the clean functions on save
	//TODO: pass identifier field
	
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	if (!data.data_source){
		data.data_source = {};
	}
	
	data.data_source = source;
	
	i_data.addElementBinding(element_id, 'fetch_sequence', [], source.fetch_sequence);
};

Data.prototype.unsetLayoutDataSource = function(element_id){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	if (!data.data_source){
		data.data_source = {};
	}

	data.data_source = {};
	
	i_data.clearElementBinding(element_id, 'fetch_sequence');
};

Data.prototype.selectElement = function(element_id){
	this.returnSelectedPageData().selected_element = element_id;
};

Data.prototype.getBindingReference = function(element_id, binding, map){
	var data = i_data.returnSelectedPageData().data.ui[element_id];
	var resolved_data = i_data.resolveElementData(data);
	data = i_data.getElementDataReference(data);
	
	if (!data.bindings_raw){
		data.bindings_raw = {};
		
	} 
	
	if (!data.bindings_raw[binding]){
		var original_bindings = resolved_data.bindings_raw;
		data.bindings_raw[binding] = JSON.parse(JSON.stringify(original_bindings[binding]));
	}
	
	var target = data.bindings_raw[binding];
	
	for (var i=0; i<map.length; i++){
		target = target[map[i]].callbacks;
	}
	
	return target;
	
};

Data.prototype.addElementBinding = function(element_id, binding, map, object){
	var target = i_data.getBindingReference(element_id, binding, map);
	target.push(object);
};

Data.prototype.clearElementBinding = function(element_id, binding){
	var target = i_data.getBindingReference(element_id, binding, []);
	target = [];
};

Data.prototype.removeElementBinding = function(element_id, binding, map, index){
	var target = i_data.getBindingReference(element_id, binding, map);
	
	target.splice(index, 1);
};

Data.prototype.setElementActionParameter = function(element_id, binding, map, action_index, parameter_index, value){
	/*var data = i_data.returnSelectedPageData().data.ui[element_id];
	data = i_data.getElementDataReference(data);
	
	var target = data.bindings_raw[binding];
	for (var i=0; i<map.length; i++){
		target = target[i].callbacks;
	}*/
	
	var target = i_data.getBindingReference(element_id, binding, map);
	
	var location = target[action_index].parameters;
	var map = [parameter_index];
	var value = JSON.parse(JSON.stringify(value));
	
	i_variables.write(value, location, map, 'set');
	
};

Data.prototype.setElementActionParameterWorkspace = function(element_id, binding, map, action_index, parameter_index, value){
	
	var target = i_data.getBindingReference(element_id, binding, map);
	
	target[action_index].parameters.value[parameter_index].value_bound = value;
};

Data.prototype.unsetElementActionParameterWorkspace = function(element_id, binding, map, action_index, parameter_index){
	
	var target = i_data.getBindingReference(element_id, binding, map);
	
	target[action_index].parameters.value[parameter_index].value_bound = {};
};

/** Data source management **/
Data.prototype.publishDataSources = function(widget, update_array){
	var data = i_app_data.app_data.data_sources;
	
	//remove old
	for (var i=data.length; i>0; i--){
		var current = data[i-1];
		if (current.widget == widget){
			data.splice(i-1, 1);
		}
	}
	
	//insert new
	for (var i=0; i<update_array.length; i++){
		var current = update_array[i];
		
		data.push(current);
	}
	
	i_app_data.app_data.data_sources = data;
	i_app_data.saveAppData();
};

//TODO: this id can be generated from the server instead of client side (remove counter and request an id every time)
Data.prototype.generateDataSourceId = function(){
	var id = i_data.data_source_counter.toString();
	i_data.data_source_counter++;
	return id;
};

Data.prototype.getDataSourceByInternalId = function(internal_id){
	var data = i_app_data.app_data.data_sources;
	for (var i=0; i<data.length; i++){
		var current = data[i];
		if (current.internal_id == internal_id){
			return current;
		}
	}
};

/******/
Data.prototype.getVariableContexts = function(element_id){
	var starting_id = element_id;
	var page_data = i_data.returnSelectedPageData();
	var contexts = {
		"type": 'object',
		"value": {},
		"value_bound": {},
		"permissions": {"edit": "editor", "delete": "editor"}
	};
	
	while (element_id != "0"){
		var element_data = page_data.data.ui[element_id];
		element_data = i_data.resolveElementData(element_data);
		
		var context = element_data.variables;
		if (!jQuery.isEmptyObject(context.value)){
			context.permissions = {"edit": "publisher", "delete": "publisher"};
			contexts.value[element_id] = context;
		} else if (starting_id == element_id){
			contexts.value[element_id] = {
				"type": 'object',
				"value": {},
				"value_bound": {},
				"permissions": {"edit": "publisher", "delete": "publisher"}
			};
		}
		
		element_id = element_data.parent_id;
	}
	
	return contexts;
};
/******/

Data.prototype.getContexts = function(element_id){
	var page_data = i_data.returnSelectedPageData();
	var contexts = [];
	
	while (element_id != "0"){
		var element_data = page_data.data.ui[element_id];
		element_data = i_data.resolveElementData(element_data);
		
		var context = element_data.data_source;
		if (!jQuery.isEmptyObject(context)){
			contexts.push(JSON.parse(JSON.stringify(context)));
		}
		
		element_id = element_data.parent_id;
	}
	
	return contexts;
};

/** Form management **/
Data.prototype.publishForm = function(form_data){
	//Is this the way to go? Maybe only for auto-form making
	/*
	var variable_map = ['app', 'Forms'];
	i_variables.write(variable_object, location, variable_map, 'push');
	*/
};

/** Actions managements **/
//TODO: this id can be generated from the server instead of client side (remove counter and request an id every time)
Data.prototype.generateActionSequenceId = function(){
	var id = i_data.action_sequence_counter.toString();
	i_data.action_sequence_counter++;
	return id;
};

Data.prototype.getActionSequences = function(){
	return i_app_data.app_data.action_sequences;
};

//TODO: this id can be generated from the server instead of client side (remove counter and request an id every time)
Data.prototype.generateCustomActionId = function(){
	var id = i_data.custom_action_counter.toString();
	i_data.custom_action_counter++;
	return id;
};

Data.prototype.getCustomActions = function(){
	return i_app_data.app_data.custom_actions;
};

/** Variables management **/
Data.prototype.getVariableContexts = function(element_id){
	var starting_id = element_id;
	var page_data = i_data.returnSelectedPageData();
	var contexts = {
		"type": 'object',
		"value": {},
		"value_bound": {},
		"permissions": {"edit": "editor", "delete": "editor"}
	};
	
	while (element_id != "0"){
		var element_data = page_data.data.ui[element_id];
		element_data = i_data.resolveElementData(element_data);
		
		var context = element_data.variables;
		if (!jQuery.isEmptyObject(context.value)){
			context.permissions = {"edit": "publisher", "delete": "publisher"};
			contexts.value[element_id] = context;
		} else if (starting_id == element_id){
			contexts.value[element_id] = {
				"type": 'object',
				"value": {},
				"value_bound": {},
				"permissions": {"edit": "publisher", "delete": "publisher"}
			};
		}
		
		element_id = element_data.parent_id;
	}
	
	return contexts;
};

Data.prototype.saveAppVariables = function(){
	i_app_data.saveAppData();
};

/** widget management **/
Data.prototype.createWidgetStorage = function(id){
	i_app_data.app_data.widget_data[id] = {};
};

Data.prototype.getWidgetStorage = function(id){
	return i_app_data.app_data.widget_data[id];
};

/** Utilities **/
//TODO: Is this here? or move to Page_Data.
//Or will this class be the interface between all the data classes and the rest of the app?
Data.prototype.returnSelectedPageData = function(){
	return i_page_data.pages[i_page_data.selected_page];
};
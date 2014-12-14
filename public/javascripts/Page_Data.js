/***
Class description: Manage app data
	
	-Server interactions
		apiFetchPages
		apiFetchPage
		apiCreatePage
		apiRenamePage
		apiDeletePage
		
	-Page management
		fetchPagesResponseHandler [apiFetchPages called in fetchAppResponseHandler]
		fetchPageResponseHandler [apiFetchPage called in fetchPagesResponseHandler]

		createPage
		createPageResponseHandler

		renamePage
		renamePageResponseHandler

		deletePage
		deletePageResponseHandler

		selectPage
		returnSelectedPageData
	
	-Utilities
		preparePagesForInterpreters
		preparePagesList

***/

function Page_Data(){
	this.selected_page = '';
	this.pages = {};
}

/** Server interactions **/
Page_Data.prototype.apiFetchPages = function (){
	var instance = this;
	$.ajax({
		type: 'GET',
		url: 'http://staging2.felix-interactive.com:5001/v1/apps/'+i_app_data.app_id+'/pages',
		success: instance.fetchPagesResponseHandler,
		fail: function(error){console.log(error);}
	});
};

Page_Data.prototype.apiFetchPage = function(page_id){
	var instance = this;
	$.ajax({
		type: 'GET',
		url: 'http://staging2.felix-interactive.com:5001/v1/apps/'+i_app_data.app_id+'/pages/'+page_id,
		success: instance.fetchPageResponseHandler,
		fail: function(error){console.log(error);}
	});
};

Page_Data.prototype.apiCreatePage = function(name, setAsStartingPage){
	var instance = this;
	$.ajax({
		type: "POST",
		url: "http://staging2.felix-interactive.com:5001/v1/apps/"+i_app_data.app_id+"/pages/",
		data: {"name": name},
		success: function(response, status){instance.createPageResponseHandler(response, status, setAsStartingPage);}
	});
};

Page_Data.prototype.apiRenamePage = function(page_id, name){
	var data = {"name": name};
	var instance = this;
	$.ajax({
		type: "POST",
		url: "http://staging2.felix-interactive.com:5001/v1/apps/"+i_app_data.app_id+"/pages/"+page_id,
		data: data,
		success: function(response, status){instance.renamePageResponseHandler(response, status, page_id, name)},
		fail: function(error){console.log(error);}
	});
};

Page_Data.prototype.apiDeletePage = function(page_id){
	var instance = this;
	$.ajax({
		type: "DELETE",
		url: "http://staging2.felix-interactive.com:5001/v1/apps/"+i_app_data.app_id+"/pages/"+page_id,
		success: function(){instance.deletePageResponseHandler(response, status, page_id)},
		fail: function(error){console.log(error);}
	});
};

/** Page management **/
Page_Data.prototype.fetchPagesResponseHandler = function(response, status){
	if (status == 'success'){
		if (response.length == 0){
			i_page_data.createPage('Homepage', true);
			return;
		}
		
		for (var i=0; i<response.length; i++){
			if (response[i].id == i_app_data.start_page){
				i_page_data.selected_page = response[i].id;
			}
			
			i_page_data.pages[response[i].id] = {"name": response[i].name};
			
			i_page_data.apiFetchPage(response[i].id);
		}
		i_pages_menu.render();
	} else {
		console.log("ajax status not success");
	}
};

Page_Data.prototype.fetchPageResponseHandler = function(response, status){
	if (status == 'success'){
		var data = JSON.parse(response.data);
		
		var highest_id = 0;
		for (var i in data.ui){
			var current = data.ui[i];
			var id = parseInt(current.id);
			if (id > highest_id){
				highest_id = id;
			}
		}
		highest_id++;
		
		//TODO: Add sort_order here?
		i_page_data.pages[response.id] = {
			"name": response.name,
			"data": data,
			"id_counter": highest_id,
			"selected_element": undefined
		};
		
		if (response.id == i_page_data.selected_page){
			i_canvas.render();
		}
	} else {
		console.log("ajax status not success");
	}
};

Page_Data.prototype.createPage = function(name, setAsStartingPage){
	i_page_data.apiCreatePage(name, setAsStartingPage);
};

Page_Data.prototype.createPageResponseHandler = function(response, status, setAsStartingPage){
	if (status == 'success'){
		var data_object = {
			"ui": JSON.parse(JSON.stringify(i_data_objects.top_level_layout)),
			"data_sources": {}
		};
		var instance = i_page_data;
		instance.pages[response.id] = {
			"name": response.name,
			"data": data_object,
			"id_counter": 1,
			"sort_order": response.sort_order,
			"selected_element": undefined
		};
		
		var variable_object = {
			"name": response.name,
			"type": 'object',
			"permissions": {"edit": 'editor', "delete": 'editor'},
			"value": {
				"page_name": {
					"type": 'value',
					"permissions": {"edit": 'editor', "delete": 'editor'},
					"value": response.name,
					"value_bound": {}
				},
				"page_id": {
					"type": 'value',
					"permissions": {"edit": 'editor', "delete": 'editor'},
					"value": response.id,
					"value_bound": {}
				},
				"params": {
					"type": 'object',
					"permissions": {"edit": 'publisher', "delete": 'editor'},
					"value": {},
					"value_bound": {}
				}
			}
		};
		var variable_map = ['app', 'Pages'];
		var location = i_app_data.getVariableObjectReference();
		i_variables.write(variable_object, location, variable_map, 'push');
		
		$.ajax({
			type: "POST",
			url: "http://staging2.felix-interactive.com:5001/v1/apps/"+i_app_data.app_id+"/pages/"+response.id,
			data: {"data": JSON.stringify(data_object)}
		});
		
		instance.selected_page = response.id;
		if (setAsStartingPage){
			i_app_data.setStartPage(response.id);
		}
		i_app_data.updatePagesList();
		i_pages_menu.render();
		i_canvas.render();
		i_options.render();
		i_canvas.highlightElement();
	} else {
		console.log("ajax status not success");
	}
};

Page_Data.prototype.renamePage = function(page_id, name){
	this.apiRenamePage(page_id, name);
	this.pages[page_id].name = name;
};

Page_Data.prototype.renamePageResponseHandler = function(response, status, page_id, name){
	if (status == 'success'){
		
		//TODO: change in variables object
	} else {console.log("ajax status not success");}
};

Page_Data.prototype.deletePage = function(page_id){
	i_page_data.apiDeletePage(page_id);
};

Page_Data.prototype.deletePageResponseHandler = function(response, status, page_id){
	if (status == 'success'){
		delete this.pages[page_id];
		//TODO: remove from variables object
		i_app_data.updatePagesList();
		console.log('success in deleting');
	} else {
		console.log("ajax status not success");
	}
};

Page_Data.prototype.selectPage = function(page_id){
	i_page_data.selected_page = page_id;
};

/** Utilities **/
Page_Data.prototype.preparePagesForInterpreters = function(){
	for (var i in i_page_data.pages){
		var page_data = i_page_data.pages[i];
		i_actions.cleanElementBindings(page_data);
	}
};

Page_Data.prototype.preparePagesList = function(){
	var list = [];

	for (var i in i_page_data.pages){
		list.push(i);
	}
	
	var starting_page = i_app_data.getStartPage();
	var index = list.indexOf(starting_page);
	
	list.splice(index, 1);
	list.unshift(starting_page);
	
	return list;
};
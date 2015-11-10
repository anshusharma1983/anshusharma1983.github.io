var pleaseWaitDiv = $('<div class="modal fade" style=top:40% id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Please wait...</h4></div><div class="modal-body"><div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div></div></div>');
var fileURL="";
var loggedInUsername="";
var currentblog = -1;
var devmode = true;
// var file;
var objectId = "";
var editblogid;
var blogs = {}; 
$.parse.init({
    app_id : "Hb2JQX1qTc5Jf6wNqLgTXSDFvP9xgrCHVgAkfKEv", // <-- enter your Application Id here 
    rest_key : "7M16XEm4RSoagE02H1R1apFZFQkk3JNG6NLvH3XG" // <--enter your REST API Key here    
});

$(document).ready(function() {
	tryCookieLogin();
	initializeFileUpload();
	initializeAddBlog();
	initializeTabs();
	initializeRegisterPage();	
});

function initializeTabs() {
	$('#tab-publish').click(function() {
		$(".class-content").hide();
		$(".publish-content").show();
		$(".class-tab").removeClass("active");
		$('#tab-publish').addClass("active");
		$("#author-input").val(loggedInUsername);
		$("#title-input").val('');
		$("#url-source-input").val('');
		$("#tag-input").val('');
		$("#category-input").val('CuratedBlogs');
		objectId = "";
		// tinyMCE.activeEditor.setContent('');
		tinyMCE.get('url-input').setContent('');
		tinyMCE.get('article-input').setContent('');
	});

	$("#tab-view").click(function(){
		viewArticle(null);
	});

	$("#tab-list").click(function(){
		$(".class-content").hide();
		$(".list-content").show();
		$(".class-tab").removeClass("active");
		$('#tab-list').addClass("active");	
		render();	
	});
}

function viewArticle(index){
	$(".class-content").hide();
	$(".view-content").show();
	$(".class-tab").removeClass("active");
	$('#tab-view').addClass("active");

	if (Object.keys(blogs).length === 0) {
		render({viewarticle : true});
		return;
	}
	showArticle(index);
}

function previousArticle(){
	console.log(currentblog);
	if (currentblog === 0) {
		alert("No more articles to display");	
		return;
	}
	openArticle(currentblog--);
}

function nextArticle(){	
	console.log(currentblog);
	if (currentblog === (Object.keys(blogs).length -1)) {
		alert("No more articles to display");
		return;
	}
	openArticle(currentblog++);
}

function showArticle(index){
	if (index != null) {
		console.log("view blog :" + index);	
		currentblog = index;
	}else if (currentblog === -1){
			currentblog = Object.keys(blogs).length -1;
	}
	if (currentblog === -1) {
		alert("Unable to load blog");
		return;
	}
	openArticle(currentblog);
}

function openArticle(id) {
	console.log("showing blog" + currentblog);
	var blog = blogs[currentblog];
	$(".viewblog-image").html('<img src="' +blog.fileURL + '" style="width:100%"/>');
	$(".viewblog-title").html(blog.title);
	$(".viewblog-url").html(_.unescape(blog.url));
}

function editArticle(index){
	var blog = blogs[index];
	editblogid = index;
	console.log("edit blog :" + index);	
	$("#tab-publish").click();
	objectId = blog.objectId;
	console.log("objectId:" + objectId);
	$("#author-input").val(blog.author);
	$("#title-input").val(blog.title);
	$("#url-source-input").val(blog.source);
	$("#tag-input").val(blog.tag);
	if (blog.category) {
		$("#category-input").val(blog.category);
	}
	fileURL = _.unescape(blog.fileURL);
	objectId = blog.objectId;
	console.log("fileURL:" + fileURL);
	tinyMCE.get('url-input').setContent(_.unescape(blog.url));
	tinyMCE.get('article-input').setContent(_.unescape(blog.article));
}

function deleteArticle(index) {
	var blog = blogs[index];
	var objectId = blog.objectId;
	blog.deleted = true;
	pleaseWaitDiv.modal('show');
	$.parse.put('Blog/' + objectId, blog, function(json){
				console.log("Successfully updated the blog");
				pleaseWaitDiv.modal('hide');
				alert("Successfully deleted the blog");
				console.log("index:::: " + index);
				blogs[index] = blog;
				render();
			}, function(){
				alert("Error deleting the blog");
				pleaseWaitDiv.modal('hide');
	})
}



function render(options){
	var viewarticle = false;
	if (arguments.length == 1) {
		viewarticle = options.viewarticle;
	}
	
	console.log("viewarticle in render:" + viewarticle);
	pleaseWaitDiv.modal('show');
		$.parse.get("Blog", {
			where : { deleted : false },
 			order : "-createdAt"
		}, function(response){
			pleaseWaitDiv.modal('hide');
				$("#blogs-table").dataTable().fnDestroy();
				blogs = {};
	         	for (var i = 0; i <response.results.length; i++) {
	         		var json = response.results[i];
	         		// console.log("setting " + Object.keys(blogs).length + ":" + i);
	         		blogs[Object.keys(blogs).length] = json;	         		
	         	}
	         	var el = $('.blogs-list');
	         	var template = _.template($('.blogs-list-template').html());
				el.html('');
				_.each(blogs, function(blog, index) {
					// console.log("rendering:" + index + ",author:" + blog.author);
					blog.url = _.unescape(blog.url);		
					var html = template(blog);
					if (devmode) {
						html = html.replace("editArticle(this)", "editArticle(" + index + ")");		
						html = html.replace("deleteArticle(this)", "deleteArticle(" + index + ")");
					} else {
						if (blog.author === loggedInUsername) {
							html = html.replace("editArticle(this)", "editArticle(" + index + ")");	
							html = html.replace("deleteArticle(this)", "deleteArticle(" + index + ")");	
						}else {
							html = html.replace("<td><span class=\"edit\"><a class=\"edit\" onclick=\"editArticle(this)\">edit</a></span></td>", "<td><span class=\"edit\"></span></td>");
							html = html.replace("<td><span class=\"edit\"><a class=\"delete\" onclick=\"deleteArticle(this)\">delete</a></span></td>", "<td><span class=\"delete\"></span></td>");
						}
					}
					html = html.replace("viewArticle(this)", "viewArticle(" + index + ")");
					// var date = new Date($(html).find(".created").text());
					html = html.replace($(html).find(".created").text(), new Date($(html).find(".created").text()).toUTCString());
					// console.log(date.toUTCString());
					el.append(html);
				});
// data table is caching old table data somehow
				var table = $("#blogs-table").DataTable();
				// table.fnClearTable();	
				table.fnDestroy();
				// $("#blogs-table").dataTable().fnDestroy();
				var table = $("#blogs-table").DataTable({
					searching : false,
					ordering : false
				});
				// table.fnDraw();
		}, function(){
			pleaseWaitDiv.modal('hide');
		});
	
}

function initializeRegisterPage(){
	$(".register-submit").click(function() {
		// $("#register-form").validate();
		var username = $("#register-email").val();
		var password = $("#password").val();
		if (username === "" || password === ""){
			return false;
		}
		
		$.parse.signup({ 
			  username : username, 
			  password : password, 
			  email : username
		},function(){
			console.log("Successfully registered");
			loggedInUsername = username;

			$.parse.login(username, password, function(){
				console.log("Successfully logged in");
				postLogin(username, password);
			}, function(){
				console.log("Failed to login");
				logout();
			})
		}, function(){
			console.log("failed to register");
			logout();
		});
	});

	$(".signin-submit").click(function(){
		// $("#signin-form").validate();
		var username = $("#signin-email").val();
		var password = $("#signin-password").val();
		if (username === "" || password === ""){
			return false;
		}
		pleaseWaitDiv.modal('show');
		$.parse.login(username, password, function(){
			pleaseWaitDiv.modal('hide');
			console.log("Successfully logged in");
			loggedInUsername = username;
			postLogin(username, password);
		}, function(){
			pleaseWaitDiv.modal('hide');
			console.log("Failed to login");
			alert("Incorrect username or password. Please try again.")
			logout();
		});
	});

	$(".logout").click(function(){
		logout();
	});

	jQuery('#register-form').validate({
            rules : {
                password : {
                    minlength : 5
                },
                password_confirm : {
                    minlength : 5,
                    equalTo : "#password"
                }
            }
        });
}

function tryCookieLogin(){
	var logincookie = $.cookie('login-cookie');
	if (logincookie) {
		console.log('Found login cookie:' + logincookie);
		var arr = logincookie.split(':');
		pleaseWaitDiv.modal('show');
		$.parse.login(arr[0], arr[1], function(){
			pleaseWaitDiv.modal('hide');
			console.log("Successfully logged in");
			loggedInUsername = arr[0];
			postLogin(arr[0], arr[1]);
		}, function(){
			pleaseWaitDiv.modal('hide');
		});	
	}else {
		console.log('Login cookie not found');
	}
}

function postLogin(username, password) {
	$(".before-login").hide();
	$(".after-login").show();
	$.cookie('login-cookie', username + ':' + password, {expires: 365});
	$("a.username").html(username);
	$(".author-input").val(username);
	$("#tab-publish").click();
}

function logout() {
	$(".before-login").show();
	$(".after-login").hide();
	$.removeCookie('login-cookie');
}

function initializeFileUpload(){
	var file;
	 // Set an event listener on the Choose File field.
    $('#fileselect').bind("change", function(e) {
      var files = e.target.files || e.dataTransfer.files;
      // Our file var now holds the selected file
      file = files[0];
      console.log("Uploading a file of size:" + file.size);
      uploadFile(file);
    });

    // This function is called when the user clicks on Upload to Parse. It will create the REST API request to upload this image to Parse.

    tinymce.init({
    	force_br_newlines : true,
        force_p_newlines : false,
        content_css : "/css/blogapp.css",
	    selector: "textarea",	    
	    plugins: "wordcount",
	    toolbar: "fontselect fontsizeselect | undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link"
	});
   }

   function uploadFile(file) {
   	  var serverUrl = 'https://api.parse.com/1/files/' + file.name;
      pleaseWaitDiv.modal('show');
      $.ajax({
        type: "POST",
        beforeSend: function(request) {
          request.setRequestHeader("X-Parse-Application-Id", 'Hb2JQX1qTc5Jf6wNqLgTXSDFvP9xgrCHVgAkfKEv');
          request.setRequestHeader("X-Parse-REST-API-Key", '7M16XEm4RSoagE02H1R1apFZFQkk3JNG6NLvH3XG');
          request.setRequestHeader("Content-Type", file.type);
        },
        url: serverUrl,
        data: file,
        processData: false,
        contentType: false,
        success: function(data) {
          console.log("File available at: " + data.url);
          fileURL = data.url;
          pleaseWaitDiv.modal('hide');
        },
        error: function(data) {
          var obj = jQuery.parseJSON(data);
          console.log(obj.error);
          pleaseWaitDiv.modal('hide');
        }
      });    
   }

   function initializeAddBlog(){
    	$('.add-blog').on('click', function() {
		$("#article-form").validate();
		var blogJSON = {};
		blogJSON.author = $('.author-input').val();
		blogJSON.title = $('.title-input').val();
		blogJSON.source = $('.url-source-input').val();
		blogJSON.tag = $('.tag-input').val();
		blogJSON.category = $(".category-input").val();
		blogJSON.url = _.escape(tinyMCE.get('url-input').getContent());
		blogJSON.article = _.escape(tinyMCE.get('article-input').getContent());
		blogJSON.fileURL = _.escape(fileURL);
		// console.log("tinymce:" + tinyMCE.activeEditor.getContent());
		
		if (blogJSON.url === "") {
			alert('The formatter is not ready yet');
			return false;
		}
		console.log("blog before publish" + JSON.stringify(blogJSON));
		pleaseWaitDiv.modal('show');
		if (objectId !== "") {
			console.log("found objectId, updating existing blog");
			$.parse.put('Blog/' + objectId, blogJSON, function(json){
				console.log("Successfully updated the blog");
				pleaseWaitDiv.modal('hide');
				alert("Successfully updated the blog");
				console.log("index:::: " + editblogid);
				blogs[editblogid] = blogJSON;
			}, function(){
				alert("Error updating the blog");
				pleaseWaitDiv.modal('hide');
			})
		}else {
			console.log("No objectId, creating new blog");
			blogJSON.deleted = false;
			$.parse.post('Blog',blogJSON, function(json){
				pleaseWaitDiv.modal('hide');
			  alert("Blog posted Successfully");			
			  blogs[Object.keys(blogs).length] = blogJSON;
			  render();
			}, function(){
				alert("Could not upload the blog");
				pleaseWaitDiv.modal('hide');
			});		
		}	
	});
   }



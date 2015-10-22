var pleaseWaitDiv = $('<div class="modal fade" style=top:40% id="pleaseWaitDialog" data-backdrop="static" data-keyboard="false"><div class="modal-dialog"><div class="modal-content"><div class="modal-header"><h4 class="modal-title">Processing...</h4></div><div class="modal-body"><div class="progress"><div class="progress-bar progress-bar-striped active" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100" style="width: 100%"></div></div></div></div></div></div>');
var fileURL="";
var loggedInUsername="";
var currentblog = -1;
var file;
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

function initializeTabs(){
	$('#tab-publish').click(function() {
		$(".class-content").hide();
		$(".publish-content").show();
		$(".class-tab").removeClass("active");
		$('#tab-publish').addClass("active");
				
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

function viewArticle(obj){
	$(".class-content").hide();
	$(".view-content").show();
	$(".class-tab").removeClass("active");
	$('#tab-view').addClass("active");

	if (Object.keys(blogs).length === 0) {
		render({viewarticle : true});
		return;
	}
	showArticle(obj);
}
function showArticle(obj){
	if (obj != null) {
		console.log("view blog :" + $(obj).closest('tr').index());	
		currentblog = $(obj).closest('tr').index();
	}else if (currentblog === -1){
			currentblog = Object.keys(blogs).length -1;
	}
	if (currentblog === -1) {
		alert("Unable to load blog");
		return;
	}
	console.log("showing blog" + currentblog);
	var blog = blogs[currentblog];
	$(".viewblog-image").html('<img src="' +blog.fileURL + '" style="width:100%"/>');
	$(".viewblog-title").html(blog.title);
	$(".viewblog-url").html(_.unescape(blog.url));
}

function editArticle(obj){
	console.log("edit blog :" + $(obj).closest('tr').index());	
}

function render(options){
	var viewarticle = false;
	if (arguments.length == 1) {
		viewarticle = options.viewarticle;
	}
	
	console.log("viewarticle in render:" + viewarticle);
	pleaseWaitDiv.modal('show');
		$.parse.get("Blog", {
 			order : "-createdAt"
		}, function(response){
			pleaseWaitDiv.modal('hide');
	         	for (var i = 0; i <response.results.length; i++) {
	         		var json = response.results[i];
	         		blogs[Object.keys(blogs).length] = json;	         		
	         	}
	         	var el = $('.blogs-list');
				var template = _.template($('.blogs-list-template').html());
				el.html('');
				_.each(blogs, function(blog) {
					blog.url = _.unescape(blog.url);		
					el.append(template(blog));
				});
				$("#blogs-table").dataTable().fnDestroy();
				$("#blogs-table").dataTable({
					searching : false,
					ordering : false

				});	      	
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
    });

    // This function is called when the user clicks on Upload to Parse. It will create the REST API request to upload this image to Parse.
    $('#uploadbutton').click(function() {
      var serverUrl = 'https://api.parse.com/1/files/' + file.name;

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
        },
        error: function(data) {
          var obj = jQuery.parseJSON(data);
          console.log(obj.error);
        }
      });
    });
    tinymce.init({
	    selector: "textarea",	    
	    toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link"
	});
   }

   function initializeAddBlog(){
    	$('.add-blog').on('click', function() {
		$("#article-form").validate();
		var blogJSON = {};
		blogJSON.author = $('.author-input').val();
		blogJSON.title = $('.title-input').val();
		blogJSON.url = _.escape(tinyMCE.activeEditor.getContent());
		blogJSON.fileURL = _.escape(fileURL);
		console.log("tinymce:" + tinyMCE.activeEditor.getContent());
		
		if (blogJSON.url === "") {
			alert('The formatter is not ready yet');
			return false;
		}
		console.log(JSON.stringify(blogJSON));
		$.parse.post('Blog',blogJSON, function(json){
		  alert("Data posted Successfully");
		  blogs[Object.keys(blogs).length] = blogJSON;
		  render();
		});		
	});
   }



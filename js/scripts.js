
Backbone.Model.prototype.idAttribute = '_id';
var fileURL="";
$.parse.init({
    app_id : "Hb2JQX1qTc5Jf6wNqLgTXSDFvP9xgrCHVgAkfKEv", // <-- enter your Application Id here 
    rest_key : "7M16XEm4RSoagE02H1R1apFZFQkk3JNG6NLvH3XG" // <--enter your REST API Key here    
});
// Backbone Model

var Blog = Backbone.Model.extend({
	defaults: {
		author: '',
		title: '',
		url: ''
	}
});

// Backbone Collection

var Blogs = Backbone.Collection.extend({
	url: 'https://api.parse.com/1/classes/Blog'
});

// instantiate two Blogs

/*var blog1 = new Blog({
	author: 'Michael',
	title: 'Michael\'s Blog',
	url: 'http://michaelsblog.com'
});
var blog2 = new Blog({
	author: 'John',
	title: 'John\'s Blog',
	url: 'http://johnsblog.com'
});*/

// instantiate a Collection

var blogs = new Blogs();

// Backbone View for one blog

var BlogView = Backbone.View.extend({
	model: new Blog(),
	tagName: 'tr',
	initialize: function() {
		this.template = _.template($('.blogs-list-template').html());
	},
	events: {
		'click .edit-blog': 'edit',
		'click .update-blog': 'update',
		'click .cancel': 'cancel',
		'click .delete-blog': 'delete'
	},
	edit: function() {
		$('.edit-blog').hide();
		$('.delete-blog').hide();
		this.$('.update-blog').show();
		this.$('.cancel').show();

		var author = this.$('.author').html();
		var title = this.$('.title').html();
		var url = this.$('.url').html();

		this.$('.author').html('<input type="text" class="form-control author-update" value="' + author + '">');
		this.$('.title').html('<input type="text" class="form-control title-update" value="' + title + '">');
		this.$('.url').html('<input type="text" class="form-control url-update" value="' + url + '">');
	},
		update: function() {
		this.model.set('author', $('.author-update').val());
		this.model.set('title', $('.title-update').val());
		this.model.set('url', $('.url-update').val());

		this.model.save(null, {
			success: function(response) {
				console.log('Successfully UPDATED blog with _id: ' + response.toJSON()._id);
			},
			error: function(err) {
				console.log('Failed to update blog!');
			}
		});
	},
	cancel: function() {
		blogsView.render();
	},
	delete: function() {
		this.model.destroy({
			success: function(response) {
				console.log('Successfully DELETED blog with _id: ' + response.toJSON()._id);
			},
			error: function(err) {
				console.log('Failed to delete blog!');
			}
		});
	},
	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	}
});

// Backbone View for all blogs

var BlogsView = Backbone.View.extend({
	model: blogs,
	el: $('.blogs-list'),
	initialize: function() {
		var self = this;
		this.model.on('add', this.render, this);
		this.model.on('change', function() {
			setTimeout(function() {
				self.render();
			}, 30);
		},this);
		this.model.on('remove', this.render, this);
		$.parse.get("Blog", function(response){
	         	for (var i = 0; i <response.results.length; i++) {
	         		var json = response.results[i];
	         		var b = new Blog({author : json.author, title: json.title, url: _.unescape(json.url)});
	         		blogs.add(b);
	         	}
		});
	},
	render: function() {
		var self = this;
		this.$el.html('');
		_.each(this.model.toArray(), function(blog) {
			self.$el.append((new BlogView({model: blog})).render().$el);
		});
		return this;
	}
});

var blogsView = new BlogsView();

$(function() {
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


  });

$(document).ready(function() {
	$('.add-blog').on('click', function() {
		
		var blogJSON = new Object();
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
		  blogsView.render();
		});
		/*$('.author-input').val('');
		$('.title-input').val('');
		$('.url-input').val('');
		blogs.add(blog);
		console.log("saving blog in db:" + blog.toJSON());
		blog.save(null, {
			success: function(response) {
				console.log('Successfully SAVED blog with _id: ' + response.toJSON()._id);
			},
			error: function() {
				console.log('Failed to save blog!');
			}
		});*/
	});

	$('#tab-publish').click(function() {
		$(".publish-content").show();
		$(".list-content").hide();
		$('#tab-publish').addClass("active");
		$('#tab-edit').removeClass("active");		
	});
	$("#tab-edit").click(function(){
		$(".publish-content").hide();
		$(".list-content").show();
		$('#tab-edit').addClass("active");
		$('#tab-publish').removeClass("active");
		blogsView.render();
	});
		tinymce.init({
	    selector: "textarea",	    
	    toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link"
	});
});


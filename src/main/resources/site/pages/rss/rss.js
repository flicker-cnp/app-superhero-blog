var stk = require('stk/stk');
var util = require('utilities');

var contentSvc = require('/lib/xp/content');
var portal = require('/lib/xp/portal');
var xslt = require('/lib/xp/xslt');

exports.get = function (req) {

    var content = portal.getContent();
    var site = portal.getSite();
    var folderPath = util.postsFolder();

    var pageUrl = portal.pageUrl( {
        path: content._path
    });

    var result = contentSvc.query( {
        start: 0,
        count: 20,
        query: '_parentPath="/content' + folderPath + '"',
        sort: 'createdTime DESC',
        contentTypes: [
            //app.name + ':post'
            'com.enonic.theme.superhero:post'
        ]
    });

    var posts = result.contents;

    for(var i = 0; i < posts.length; i++) {
        var author = stk.content.get(posts[i].data.author);
        posts[i].data.authorName = author.data.name;
        posts[i].data.tags = stk.data.forceArray(posts[i].data.tags);

        posts[i].data.category = stk.data.forceArray(posts[i].data.category);
        posts[i].data.categoryNames = [];

        if(posts[i].data.category) {
            for(var j = 0; j < posts[i].data.category.length; j++) {
                posts[i].data.categoryNames.push(stk.content.getProperty(posts[i].data.category[j], 'displayName'));
            }
        }

        var comments = contentSvc.query( {
            start: 0,
            count: 1000,
            query: "data.post = '" + posts[i]._id + "'",
            sort: 'createdTime DESC',
            contentTypes: [
                app.name + ':comment'
            ]
        });

        posts[i].data.numComments = comments.total;

    }

    var params = {
        content: content,
        posts: posts,
        pageUrl: pageUrl,
        site: site
    };

    var view = resolve('rss.xsl');
    //var copy = resolve('copy-of.xsl');

    var body = xslt.render(view, params);

    return {
        contentType: 'text/xml',
        body: body
    };
};
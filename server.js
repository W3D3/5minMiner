let Parser = require('rss-parser');
let parser = new Parser();

var url = "https://www.5min.at/feed/";

var MongoClient = require('mongodb').MongoClient;
var dburl = "mongodb://localhost:27017/";

MongoClient.connect(dburl, function(err, db) {
    if (err) throw err;

    var dbo = db.db("mydb");

    readLatestData(db);
    setInterval(readLatestData, 60*5*1000);
});

function readLatestData(db) {
    var dbo = db.db("mydb");
    // runs every 60 sec and runs on init.
    (async () => {
    
        let feed = await parser.parseURL(url);
        console.log(feed.title);
    
        feed.items.forEach(item => {
            item._id = item.guid;
            try {
                dbo.collection("5min").insertOne(item, function(err, res) {
                    if (err) {
                        if(err.code == 11000) console.log("dupe.");
                        else console.log(err)
                    }
                    else { 
                        console.log(item.title + ' inserted');
                    }
                    db.close();
                });
            } catch(err) {
                console.log("Error saving / " + err)
            }
            
        });
    
    })();
}
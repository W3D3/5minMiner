let Parser = require('rss-parser');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const f = require('util').format;
let parser = new Parser();

const myFormat = printf(info => {
    return `[${info.timestamp}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: 'combined.log' })
    ],
    exitOnError: false
  });

var url = "https://www.5min.at/feed/";

var MongoClient = require('mongodb').MongoClient;
const user = encodeURIComponent('miner');
const password = encodeURIComponent(process.env.MINERDBPW);
const authMechanism = encodeURIComponent('SCRAM-SHA-1');

var dburl = f("mongodb://%s:%s@wedenig.org:27017/?authMechanism=%s&authSource=mydb", user, password, authMechanism);

readLatestData();
setInterval(readLatestData, 15*60*1000);

logger.log({
    level: 'info',
    message: "Started 5min Miner. "
});

// runs every 15mins and runs on init.
function readLatestData() {
    MongoClient.connect(dburl, { useNewUrlParser: true }, function(err, db) {
        if (err) throw err;
    
        var dbo = db.db("mydb");
    
        (async () => {
        
            let feed = await parser.parseURL(url);

            logger.log({
                level: 'info',
                message: "Fetching information from : " + feed.title
            });
        
            feed.items.forEach(item => {
                item._id = item.guid;
                try {
                    dbo.collection("5min").insertOne(item, function(err, res) {
                        if (err) {
                            if(err.code == 11000) {
                                // duplicate entry, don't care
                                //TODO log somewhere maybe?
                            } else {
                                logger.log({
                                    level: 'error',
                                    message: "Error saving article \n " + JSON.stringify(err)
                                });
                            }
                        }
                        else { 
                            logger.log({
                                level: 'info',
                                message: "Inserted: " + item.title
                            });

                        }
                        db.close();
                    });
                } catch(err) {
                    logger.log({
                        level: 'error',
                        message: "Error saving article \n " + JSON.stringify(err)
                    });
                }
                
            });
        
        })();
        
    });
}
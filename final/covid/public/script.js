const admin = require('../functions/node_modules/firebase-admin');
const serviceAccount = require("../itp-covid-firebase-adminsdk-n6elf-a7c44e7187.json");

 
/** csv file
a,b,c
1,2,3
4,5,6
*/
const csvFilePath="test.csv"
var csv = require("csvtojson");

csv().fromFile(csvFilePath).on("json",function(jsonArrayObj){ 
  console.log("hello");   
  console.log(jsonArrayObj); 
   })

// csv()
// .fromFile(csvFilePath)
// .then((jsonObj)=>{
//     console.log(jsonObj);
    /**
     * [
     * 	{a:"1", b:"2", c:"3"},
     * 	{a:"4", b:"5". c:"6"}
     * ]
     */ 
// })
 
// Async / await usage
// const jsonArray=await csv().fromFile(csvFilePath);




admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-database-name>.firebaseio.com"
});
const db = admin.firestore();
const data = require("../data/population.json");

/**
 * Data is a collection if
 *  - it has a odd depth
 *  - contains only objects or contains no objects.
 */
function isCollection(data, path, depth) {
  if (
    typeof data != 'object' ||
    data == null ||
    data.length === 0 ||
    isEmpty(data)
  ) {
    return false;
  }

  for (const key in data) {
    if (typeof data[key] != 'object' || data[key] == null) {
      // If there is at least one non-object item in the data then it cannot be collection.
      return false;
    }
  }

  return true;
}

// Checks if object is empty.
function isEmpty(obj) {
  for(const key in obj) {
    if(obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

async function upload(data, path) {
  return await admin.firestore()
    .doc(path.join('/'))
    .set(data)
    .then(() => {console.log(`Document ${path.join('/')} uploaded.`)
      //var csv = require("csvtojson");
    })
    .catch(() => console.error(`Could not write document ${path.join('/')}.`));
}

/**
 *
 */
async function resolve(data, path = []) {
  (async() => {
    try {
      console.log('start!')
      let deaths = 0;
      let infected = 0;
      let recovered = 0;
      for(let j=2;j<7;j++) {
        let filename = '01-0' + j + '-2021.csv'
        let data = await csv().fromFile(filename);
        for(let i=0;i<data.length;i++) {
          console.log(data[i]['Combined_Key']);
          console.log(data[i].Deaths);
          if(data[i]['Country_Region'] == 'US') {
            deaths += parseInt(data[i]['Deaths']);
            infected += parseInt(data[i]['Confirmed']);
            recovered += parseInt(data[i]['Recovered']);
          }
        }
        let docname = '01-0' + j + '-2021';
        let docRef = db.collection('test').doc(docname);
          await docRef.set({
            deaths:deaths,
            infected:infected,
            recovered:recovered
          })
      }
    } catch(err) {
      console.log('failed',err)
    }
  })();
  
}

resolve(data);